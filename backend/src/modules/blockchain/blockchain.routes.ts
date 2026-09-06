import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  verifyVersion,
  getVersionAnchor,
  blockchainHealth
} from "./blockchain.controller";

const router = Router();

router.get("/blockchain/health", authenticate, blockchainHealth);

router.get(
  "/document-versions/:versionId/blockchain",
  authenticate,
  getVersionAnchor
);

router.get("/document-versions/:versionId/verify", authenticate, verifyVersion);
router.post("/document-versions/:versionId/verify", authenticate, verifyVersion);

export default router;
