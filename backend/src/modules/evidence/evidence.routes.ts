import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createEvidenceController,
  getEvidence,
  createTransferController,
  acceptTransferController,
  rejectTransferController,
  custodyHistory,
  verifyCustodyHistoryController
} from "./evidence.controller";

const router = Router();

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

export default router;
