import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
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

export async function grantPermission(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = grantCasePermissionSchema.parse(req.body);
    const createdById = req.userId!;
    const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : undefined;

    const result = await grantCasePermission(
      req.params.caseId as string,
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
    const parsed = revokeCasePermissionSchema.parse(req.body);

    await revokeCasePermission(
      req.params.caseId as string,
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
    const result = await getUserCasePermissions(
      req.params.caseId as string,
      req.params.userId as string
    );

    res.json({
      permissions: result
    });
  } catch (error) {
    next(error);
  }
}
