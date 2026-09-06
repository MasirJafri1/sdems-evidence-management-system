import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createCase,
  getCases,
  getCase,
  addParticipant,
  getParticipants,
  requestCaseAccess,
  listCaseAccessRequests,
  resolveCaseAccessRequest,
  verifyCase
} from "./case.controller";

const router = Router();

router.post("/organizations/:organizationId/cases", authenticate, createCase);
router.get("/organizations/:organizationId/cases", authenticate, getCases);
router.get("/cases/:caseId", authenticate, getCase);
router.post("/cases/:caseId/participants", authenticate, addParticipant);
router.get("/cases/:caseId/participants", authenticate, getParticipants);

router.post("/cases/access-requests", authenticate, requestCaseAccess);
router.get("/cases/access-requests", authenticate, listCaseAccessRequests);
router.get("/cases/:caseId/access-requests", authenticate, listCaseAccessRequests);
router.post("/cases/access-requests/:id/resolve", authenticate, resolveCaseAccessRequest);
router.get("/cases/verify/:caseNumber", authenticate, verifyCase);

export default router;
