import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import {
  grantCasePermission,
  revokeCasePermission,
  getUserCasePermissions,
  checkCasePermission
} from "./authorization.service";
import {
  grantCasePermissionSchema,
  revokeCasePermissionSchema
} from "./authorization.schema";

/**
 * Validates that the caller is authorized to configure or revoke case permissions.
 * Authorized actors:
 * 1. Global Super Admin
 * 2. Active Case Administrators for this case
 * 3. Organization Administrators of the case-owning organization
 */
async function isAuthorizedToManagePermissions(userId: string, caseId: string): Promise<boolean> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!currentUser || !currentUser.isActive) {
    return false;
  }

  // 1. Global Super Admin
  if (currentUser.email === "superadmin@gov.in") {
    return true;
  }

  // 2. Active Case Administrator check
  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId
      }
    }
  });

  if (participant?.status === "ACTIVE" && participant?.isCaseAdmin) {
    return true;
  }

  // 3. Organization Admin of the case-owning organization
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { organizationId: true }
  });

  if (caseRecord) {
    const orgMembership = await prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId: caseRecord.organizationId,
        status: "ACTIVE"
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (orgMembership?.role) {
      const perms = orgMembership.role.permissions.map((rp) => rp.permission.name);
      if (
        perms.includes("ROLE_MANAGE") ||
        perms.includes("CASE_PERMISSION_GRANT") ||
        perms.includes("CASE_PERMISSION_REVOKE") ||
        orgMembership.role.name.toLowerCase().includes("admin")
      ) {
        return true;
      }
    }
  }

  return false;
}

export async function grantPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const caseId = req.params.caseId as string;
    const createdById = req.userId!;

    const canManage = await isAuthorizedToManagePermissions(createdById, caseId);
    if (!canManage) {
      res.status(403).json({
        message: "Only case or organization administrators can modify case permissions"
      });
      return;
    }

    const parsed = grantCasePermissionSchema.parse(req.body);
    const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : undefined;

    const result = await grantCasePermission(
      caseId,
      parsed.userId,
      parsed.permissionName,
      parsed.effect,
      createdById,
      expiresAt
    );

    res.status(201).json({
      message: "Case permission configured",
      permission: result
    });
  } catch (error) {
    next(error);
  }
}

export async function revokePermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const caseId = req.params.caseId as string;
    const userId = req.userId!;

    const canManage = await isAuthorizedToManagePermissions(userId, caseId);
    if (!canManage) {
      res.status(403).json({
        message: "Only case or organization administrators can modify case permissions"
      });
      return;
    }

    const parsed = revokeCasePermissionSchema.parse(req.body);

    await revokeCasePermission(
      caseId,
      parsed.userId,
      parsed.permissionName
    );

    res.json({
      message: "Case permission revoked"
    });
  } catch (error) {
    next(error);
  }
}

export async function checkPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.userId!;
    const permissionName = req.query.permission as string;

    if (!permissionName) {
      res.status(400).json({
        message: "permission query parameter is required"
      });
      return;
    }

    const result = await checkCasePermission({
      userId,
      caseId: req.params.caseId as string,
      permissionName
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function listUserPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const caseId = req.params.caseId as string;
    const callerId = req.userId!;

    // Caller must be authorized admin or an active participant of the case
    const canManage = await isAuthorizedToManagePermissions(callerId, caseId);
    if (!canManage) {
      const callerParticipant = await prisma.caseParticipant.findUnique({
        where: { caseId_userId: { caseId, userId: callerId } }
      });
      if (!callerParticipant || callerParticipant.status !== "ACTIVE") {
        res.status(403).json({
          message: "You are not an active participant of this case"
        });
        return;
      }
    }

    const result = await getUserCasePermissions(
      caseId,
      req.params.userId as string
    );

    res.json({
      permissions: result
    });
  } catch (error) {
    next(error);
  }
}
