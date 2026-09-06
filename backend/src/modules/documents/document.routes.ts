import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import {
  createDocument,
  listDocuments,
  listOrganizationDocuments,
  getDocument,
  downloadDocument,
  createDocumentVersion
} from "./document.controller";

const router = Router();

router.get("/documents", authenticate, listOrganizationDocuments);

router.post(
  "/cases/:caseId/documents",
  authenticate,
  upload.single("file"),
  createDocument
);

router.get("/cases/:caseId/documents", authenticate, listDocuments);

router.get("/documents/:documentId", authenticate, getDocument);

router.get(
  "/documents/:documentId/versions/:versionNumber/download",
  authenticate,
  downloadDocument
);

router.post(
  "/documents/:documentId/versions",
  authenticate,
  upload.single("file"),
  createDocumentVersion
);

export default router;
