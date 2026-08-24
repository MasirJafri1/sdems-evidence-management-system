import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import {
  createDocument,
  listDocuments,
  getDocument,
  downloadDocument,
  createDocumentVersion
} from "./document.controller";

const router = Router();

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
