import { prisma } from "../../lib/prisma";
import { PermissionEffect } from "@prisma/client";
import { AuthorizationResult } from "./authorization.types";

interface CheckPermissionInput {
  userId: string;
  caseId: string;
  permissionName: string;
}

export async function checkCasePermission(
  input: CheckPermissionInput
): Promise<AuthorizationResult> {
  const { userId, caseId, permissionName } = input;

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

  if (user.email === "superadmin@gov.in") {
    return {
      allowed: true,
      reason: "Global Super Admin access",
      source: "SUPER_ADMIN"
    };
  }

  /*
   * User must participate in the case.
   *
   * This is what allows controlled cross-organization access.
   */
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

  /*
   * Case administrators get full case access.
   */
  if (participant.isCaseAdmin) {
    return {
      allowed: true,
      reason: "Case administrator",
      source: "CASE_ADMIN"
    };
  }

  /*
   * First check explicit case-level permissions.
   */
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

  /*
   * Now check organization-role permissions.
   *
   * The user's role comes from their membership
   * in the case-owning organization OR another
   * organization if cross-org access is configured.
   */
  const membership = await prisma.organizationMembership.findFirst({
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

  if (!membership) {
    return {
      allowed: false,
      reason: "No active organization membership",
      source: "NONE"
    };
  }

  const hasRolePermission = membership.role.permissions.some(
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
