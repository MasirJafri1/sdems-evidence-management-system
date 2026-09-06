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

// Access Requests and Verification (Static sub-paths must precede parameter :caseId)
router.post("/cases/access-requests", authenticate, requestCaseAccess);
router.get("/cases/access-requests", authenticate, listCaseAccessRequests);
router.get("/cases/:caseId/access-requests", authenticate, listCaseAccessRequests);
router.post("/cases/access-requests/:id/resolve", authenticate, resolveCaseAccessRequest);
router.get("/cases/verify/:caseNumber", authenticate, verifyCase);

// Organization and Specific Case Routes
router.post("/organizations/:organizationId/cases", authenticate, createCase);
router.get("/organizations/:organizationId/cases", authenticate, getCases);
router.get("/cases/:caseId", authenticate, getCase);
router.post("/cases/:caseId/participants", authenticate, addParticipant);
router.get("/cases/:caseId/participants", authenticate, getParticipants);

export default router;
