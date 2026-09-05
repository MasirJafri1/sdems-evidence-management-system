import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createEvidenceController,
  getEvidence,
  createTransferController,
  acceptTransferController,
  rejectTransferController,
  custodyHistory,
  verifyCustodyHistoryController,
  listCaseEvidenceController,
  listOrganizationEvidenceController,
  listMyTransfersController
} from "./evidence.controller";

const router = Router();

router.get(
  "/evidence",
  authenticate,
  listOrganizationEvidenceController
);

router.get(
  "/cases/:caseId/evidence",
  authenticate,
  listCaseEvidenceController
);

router.post(
  "/evidence",
  authenticate,
  createEvidenceController
);

router.get(
  "/evidence/:evidenceId",
  authenticate,
  getEvidence
);

router.post(
  "/evidence/:evidenceId/transfers",
  authenticate,
  createTransferController
);

router.post(
  "/transfers/:transferId/accept",
  authenticate,
  acceptTransferController
);

router.post(
  "/transfers/:transferId/reject",
  authenticate,
  rejectTransferController
);

router.get(
  "/evidence/:evidenceId/custody-history",
  authenticate,
  custodyHistory
);

router.get(
  "/evidence/:evidenceId/custody-history/verify",
  authenticate,
  verifyCustodyHistoryController
);

router.get(
  "/transfers",
  authenticate,
  listMyTransfersController
);

export default router;
