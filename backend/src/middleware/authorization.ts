import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { checkCasePermission } from "../modules/authorization/authorization.service";
import { PermissionName } from "../utils/authorization";
import { prisma } from "../lib/prisma";

export function requireCasePermission(permissionName: PermissionName) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          message: "Authentication required"
        });
        return;
      }

      let caseId: string | undefined = (req.params.caseId || req.params.id || req.body.caseId) as string | undefined;

      /*
       * Resource awareness: If caseId is not directly in params or body,
       * resolve caseId from documentId, versionId, or evidenceId.
       */
      const docIdParam = (req.params.documentId || req.params.id) as string | undefined;
      if (!caseId && docIdParam) {
        const doc = await prisma.document.findUnique({
          where: { id: docIdParam },
          select: { caseId: true }
        });
        if (doc) caseId = doc.caseId;
      }

      const versionIdParam = (req.params.versionId || req.params.documentVersionId) as string | undefined;
      if (!caseId && versionIdParam) {
        const version = await prisma.documentVersion.findUnique({
          where: { id: versionIdParam },
          select: { documentId: true }
        });
        if (version) {
          const doc = await prisma.document.findUnique({
            where: { id: version.documentId },
            select: { caseId: true }
          });
          if (doc) caseId = doc.caseId;
        }
      }

      const evidenceIdParam = (req.params.evidenceId || req.params.id) as string | undefined;
      if (!caseId && evidenceIdParam) {
        const evidence = await prisma.evidence.findUnique({
          where: { id: evidenceIdParam },
          select: { caseId: true }
        });
        if (evidence) caseId = evidence.caseId;
      }

      if (!caseId) {
        res.status(400).json({
          message: "Case ID is required for authorization check"
        });
        return;
      }

      const result = await checkCasePermission({
        userId,
        caseId,
        permissionName
      });

      if (!result.allowed) {
        res.status(403).json({
          message: "Forbidden",
          reason: result.reason
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
