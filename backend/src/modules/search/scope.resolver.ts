import { prisma } from "../../lib/prisma";

/**
 * Multi-organization search scope.
 *
 * Replaces the broken single-org model where `memberships[0]`
 * was used as the user's sole organization context.
 *
 * A user can now be:
 *   - Admin of Org A and Org C
 *   - Investigator in Org B
 *   - Case participant in cases across any org
 *
 * The search scope correctly reflects all of these.
 */
export interface UserSearchScope {
  userId: string;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;

  /** Organization IDs where the user holds an ADMIN role */
  adminOrganizationIds: string[];

  /** All organization IDs the user belongs to */
  memberOrganizationIds: string[];

  /** Case IDs the user is an active participant in */
  allowedCaseIds: string[];
}

/**
 * Resolves the authenticated user's authorization perimeter.
 * Zero-Trust Principle:
 * - SuperAdmin: Sees all cases across all organizations.
 * - Org Admin: Sees all cases belonging to their administered organizations.
 * - Officer / Investigator / Forensic: Strictly restricted to cases where they have an ACTIVE CaseParticipant record.
 */
export async function resolveUserSearchScope(userId: string): Promise<UserSearchScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return {
      userId,
      isSuperAdmin: false,
      isOrgAdmin: false,
      adminOrganizationIds: [],
      memberOrganizationIds: [],
      allowedCaseIds: []
    };
  }

  const isSuperAdmin = (user as any).systemRole === "SUPER_ADMIN";

  // Load ALL active organization memberships with roles
  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    include: {
      role: true
    }
  });

  const adminOrganizationIds: string[] = [];
  const memberOrganizationIds: string[] = [];

  for (const m of memberships) {
    memberOrganizationIds.push(m.organizationId);

    const roleName = m.role?.name || "";
    if (
      roleName === "ADMIN" ||
      roleName === "Organization Admin" ||
      roleName.toLowerCase().includes("admin")
    ) {
      adminOrganizationIds.push(m.organizationId);
    }
  }

  let allowedCaseIds: string[] = [];

  if (isSuperAdmin) {
    // SuperAdmin: no case filter needed (empty array signals "all")
    allowedCaseIds = [];
  } else if (adminOrganizationIds.length > 0) {
    // Org Admins: get all cases from their admin orgs
    const orgCases = await prisma.case.findMany({
      where: { organizationId: { in: adminOrganizationIds } },
      select: { id: true }
    });
    const orgCaseIds = new Set(orgCases.map((c) => c.id));

    // Also include cases they directly participate in (could be cross-org)
    const participants = await prisma.caseParticipant.findMany({
      where: {
        userId,
        status: "ACTIVE"
      },
      select: {
        caseId: true
      }
    });
    for (const p of participants) {
      orgCaseIds.add(p.caseId);
    }

    allowedCaseIds = Array.from(orgCaseIds);
  } else {
    // Regular user: ONLY cases they are actively assigned to
    const participants = await prisma.caseParticipant.findMany({
      where: {
        userId,
        status: "ACTIVE"
      },
      select: {
        caseId: true
      }
    });
    allowedCaseIds = participants.map((p) => p.caseId);
  }

  return {
    userId,
    isSuperAdmin,
    isOrgAdmin: adminOrganizationIds.length > 0,
    adminOrganizationIds,
    memberOrganizationIds,
    allowedCaseIds
  };
}
