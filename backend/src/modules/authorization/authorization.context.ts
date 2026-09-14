import { prisma } from "../../lib/prisma";

/**
 * Centralized Authorization Context
 *
 * Provides a complete, deterministic view of what a user
 * is allowed to access. Built once per request and consumed
 * by every authorization check.
 *
 * Replaces the fragmented pattern of each controller building
 * its own ad-hoc authorization logic.
 */
export interface AuthorizationContext {
  userId: string;
  isSuperAdmin: boolean;

  memberships: {
    organizationId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
  }[];

  /** Organization IDs where the user holds an ADMIN role */
  adminOrganizationIds: string[];

  /** All organization IDs the user belongs to */
  memberOrganizationIds: string[];

  /** Case IDs the user is an active participant in */
  allowedCaseIds: string[];
}

/**
 * Builds a full AuthorizationContext for the given user.
 *
 * This loads everything in as few queries as possible so the
 * authorization engine can make decisions without additional
 * database round-trips.
 */
export async function buildAuthorizationContext(
  userId: string
): Promise<AuthorizationContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.isActive) {
    return {
      userId,
      isSuperAdmin: false,
      memberships: [],
      adminOrganizationIds: [],
      memberOrganizationIds: [],
      allowedCaseIds: []
    };
  }

  const isSuperAdmin = (user as any).systemRole === "SUPER_ADMIN";

  // Load all active organization memberships with roles and permissions
  const dbMemberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  const memberships = dbMemberships.map((m) => ({
    organizationId: m.organizationId,
    roleId: m.roleId,
    roleName: m.role.name,
    permissions: m.role.permissions.map((rp) => rp.permission.name)
  }));

  const adminOrganizationIds = memberships
    .filter(
      (m) =>
        m.roleName === "ADMIN" ||
        m.roleName === "Organization Admin" ||
        m.roleName.toLowerCase().includes("admin")
    )
    .map((m) => m.organizationId);

  const memberOrganizationIds = memberships.map((m) => m.organizationId);

  // Load case participation
  const caseParticipants = await prisma.caseParticipant.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    select: {
      caseId: true
    }
  });

  const allowedCaseIds = caseParticipants.map((cp) => cp.caseId);

  return {
    userId,
    isSuperAdmin,
    memberships,
    adminOrganizationIds,
    memberOrganizationIds,
    allowedCaseIds
  };
}

/**
 * Checks if the user is a Super Admin using the systemRole field.
 * Replaces all instances of `user.email === "superadmin@gov.in"`.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, isActive: true }
  });

  return Boolean(user?.isActive && (user as any)?.systemRole === "SUPER_ADMIN");
}
