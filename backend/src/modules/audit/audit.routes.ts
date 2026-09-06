import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  getAuditHistory,
  verifyAuditChain,
  getAuditEvents,
  verifyAuditChainGeneral
} from "./audit.controller";

const router = Router();

router.get("/audit", authenticate, getAuditEvents);
router.get("/audit/verify", authenticate, verifyAuditChainGeneral);

router.get("/cases/:caseId/audit", authenticate, getAuditHistory);
router.get("/cases/:caseId/audit/verify", authenticate, verifyAuditChain);

export default router;
