import { prisma } from "../../lib/prisma";

export interface UserSearchScope {
  userId: string;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  organizationId: string | null;
  allowedCaseIds: string[];
}

/**
 * Resolves the authenticated user's authorization perimeter.
 * Zero-Trust Principle:
 * - SuperAdmin: Sees all cases across all organizations.
 * - Org Admin: Sees all cases belonging to their organization.
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
      organizationId: null,
      allowedCaseIds: []
    };
  }

  const isSuperAdmin = user.email === "superadmin@gov.in";

  // Check active organization memberships
  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    include: {
      role: true
    }
  });

  const activeOrgMembership = memberships[0] || null;
  const isOrgAdmin = Boolean(
    activeOrgMembership &&
      (activeOrgMembership.role?.name === "ADMIN" ||
        activeOrgMembership.roleId.toLowerCase().includes("admin"))
  );

  let allowedCaseIds: string[] = [];

  if (isSuperAdmin) {
    allowedCaseIds = []; // No case filter needed
  } else if (isOrgAdmin && activeOrgMembership) {
    // Org Admin can see all cases under their organization
    const orgCases = await prisma.case.findMany({
      where: { organizationId: activeOrgMembership.organizationId },
      select: { id: true }
    });
    allowedCaseIds = orgCases.map((c) => c.id);
  } else {
    // Regular investigator / officer: ONLY cases they are actively assigned to
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
    isOrgAdmin,
    organizationId: activeOrgMembership?.organizationId || null,
    allowedCaseIds
  };
}
