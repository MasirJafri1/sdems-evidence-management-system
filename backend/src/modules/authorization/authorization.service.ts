import { prisma } from "../../lib/prisma";
import { PermissionEffect } from "@prisma/client";
import { AuthorizationResult } from "./authorization.types";

interface CheckPermissionInput {
  userId: string;
  caseId: string;
  permissionName: string;
}

/**
 * Centralized case permission check.
 *
 * Decision tree (executed in this exact order):
 *
 *  1. User exists and is active?        → No  → DENY
 *  2. systemRole === SUPER_ADMIN?        → Yes → ALLOW
 *  3. Resolve case → case.organizationId
 *  4. Find membership in THAT org        (userId_organizationId)
 *  5. Is that membership's role ADMIN?   → Yes → ALLOW (ORG_ADMIN)
 *  6. Is user active CaseParticipant?    → No  → DENY
 *  7. Is participant isCaseAdmin?        → Yes → ALLOW
 *  8. Explicit CasePermission?
 *  9. Organization RolePermission?
 * 10. DENY
 */
export async function checkCasePermission(
  input: CheckPermissionInput
): Promise<AuthorizationResult> {
  const { userId, caseId, permissionName } = input;

  // --- Step 1: Validate case exists ---
  const caseRecord = await prisma.case.findUnique({
    where: {
      id: caseId
    }
  });

  if (!caseRecord) {
    return {
      allowed: false,
      reason: "Case not found",
      source: "NONE"
    };
  }

  // --- Step 1b: Validate user exists and is active ---
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user || !user.isActive) {
    return {
      allowed: false,
      reason: "User is inactive",
      source: "NONE"
    };
  }

  // --- Step 2: Super Admin check (systemRole, not email) ---
  if ((user as any).systemRole === "SUPER_ADMIN") {
    return {
      allowed: true,
      reason: "Global Super Admin access",
      source: "SUPER_ADMIN"
    };
  }

  // --- Step 3 + 4: Find membership in the case's organization ---
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: caseRecord.organizationId
      }
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

  // --- Step 5: Org Admin gets full case access ---
  if (membership && membership.status === "ACTIVE") {
    const roleName = membership.role?.name || "";
    const isOrgAdmin =
      roleName === "ADMIN" ||
      roleName === "Organization Admin" ||
      roleName.toLowerCase().includes("admin");

    if (isOrgAdmin) {
      return {
        allowed: true,
        reason: "Organization administrator",
        source: "ORG_ADMIN"
      };
    }
  }

  // --- Step 6: Check CaseParticipant ---
  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "User is not an active case participant",
      source: "NONE"
    };
  }

  // --- Step 7: Case administrator ---
  if (participant.isCaseAdmin) {
    return {
      allowed: true,
      reason: "Case administrator",
      source: "CASE_ADMIN"
    };
  }

  // --- Step 8: Explicit case-level permissions ---
  const permission = await prisma.permission.findUnique({
    where: {
      name: permissionName
    }
  });

  if (!permission) {
    return {
      allowed: false,
      reason: "Permission does not exist",
      source: "NONE"
    };
  }

  const casePermission = await prisma.casePermission.findUnique({
    where: {
      caseId_userId_permissionId: {
        caseId,
        userId,
        permissionId: permission.id
      }
    }
  });

  if (casePermission) {
    if (casePermission.expiresAt && casePermission.expiresAt < new Date()) {
      /*
       * Expired permission is ignored.
       */
    } else if (casePermission.effect === PermissionEffect.DENY) {
      return {
        allowed: false,
        reason: "Explicit case-level denial",
        source: "CASE_PERMISSION",
        effect: "DENY"
      };
    } else {
      return {
        allowed: true,
        reason: "Explicit case-level permission",
        source: "CASE_PERMISSION",
        effect: "GRANT"
      };
    }
  }

  // --- Step 9: Organization role permissions ---
  // Use the membership we already loaded (from the case's org)
  // If user is not in the case's org, also check their other memberships
  let effectiveMembership = membership;

  if (!effectiveMembership || effectiveMembership.status !== "ACTIVE") {
    // User might have cross-org access via another membership
    effectiveMembership = await prisma.organizationMembership.findFirst({
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
  }

  if (!effectiveMembership) {
    return {
      allowed: false,
      reason: "No active organization membership",
      source: "NONE"
    };
  }

  const hasRolePermission = effectiveMembership.role.permissions.some(
    (rolePermission) => rolePermission.permission.name === permissionName
  );

  if (hasRolePermission) {
    return {
      allowed: true,
      reason: "Permission granted by organization role",
      source: "ROLE_PERMISSION",
      effect: "GRANT"
    };
  }

  // --- Step 10: Deny ---
  return {
    allowed: false,
    reason: "User does not have required permission",
    source: "NONE"
  };
}

export async function grantCasePermission(
  caseId: string,
  userId: string,
  permissionName: string,
  effect: "GRANT" | "DENY",
  createdById: string,
  expiresAt?: Date
) {
  const permission = await prisma.permission.findUnique({
    where: {
      name: permissionName
    }
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    throw new Error("User must be an active case participant");
  }

  return prisma.casePermission.upsert({
    where: {
      caseId_userId_permissionId: {
        caseId,
        userId,
        permissionId: permission.id
      }
    },
    update: {
      effect,
      expiresAt
    },
    create: {
      caseId,
      userId,
      permissionId: permission.id,
      effect,
      expiresAt,
      createdById
    }
  });
}

export async function revokeCasePermission(
  caseId: string,
  userId: string,
  permissionName: string
) {
  const permission = await prisma.permission.findUnique({
    where: {
      name: permissionName
    }
  });

  if (!permission) {
    throw new Error("Permission not found");
  }

  const existing = await prisma.casePermission.findUnique({
    where: {
      caseId_userId_permissionId: {
        caseId,
        userId,
        permissionId: permission.id
      }
    }
  });

  if (!existing) {
    return null;
  }

  return prisma.casePermission.delete({
    where: {
      caseId_userId_permissionId: {
        caseId,
        userId,
        permissionId: permission.id
      }
    }
  });
}

export async function getUserCasePermissions(
  caseId: string,
  userId: string
) {
  return prisma.casePermission.findMany({
    where: {
      caseId,
      userId
    },
    include: {
      permission: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}
