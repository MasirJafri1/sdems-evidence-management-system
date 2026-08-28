import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { checkCasePermission } from "../modules/authorization/authorization.service";
import {
  getCaseIdFromDocument,
  getCaseIdFromEvidence
} from "../modules/authorization/authorization.resource";
import { PermissionName } from "../utils/authorization";

export function requireDocumentPermission(permissionName: PermissionName) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          message: "Authentication required"
        });
        return;
      }

      const documentId = (req.params.documentId || req.params.id) as string;

      if (!documentId) {
        res.status(400).json({
          message: "Document ID is required"
        });
        return;
      }

      const caseId = await getCaseIdFromDocument(documentId);

      if (!caseId) {
        res.status(404).json({
          message: "Document not found"
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

export function requireEvidencePermission(permissionName: PermissionName) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          message: "Authentication required"
        });
        return;
      }

      const evidenceId = (req.params.evidenceId || req.params.id) as string;

      if (!evidenceId) {
        res.status(400).json({
          message: "Evidence ID is required"
        });
        return;
      }

      const caseId = await getCaseIdFromEvidence(evidenceId);

      if (!caseId) {
        res.status(404).json({
          message: "Evidence not found"
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
