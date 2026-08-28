import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { getAuditHistory, verifyAuditChain } from "./audit.controller";

const router = Router();

router.get("/cases/:caseId/audit", authenticate, getAuditHistory);

router.get("/cases/:caseId/audit/verify", authenticate, verifyAuditChain);

export default router;
