import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createCase,
  getCases,
  getCase,
  addParticipant,
  getParticipants
} from "./case.controller";

const router = Router();

router.post("/organizations/:organizationId/cases", authenticate, createCase);
router.get("/organizations/:organizationId/cases", authenticate, getCases);
router.get("/cases/:caseId", authenticate, getCase);
router.post("/cases/:caseId/participants", authenticate, addParticipant);
router.get("/cases/:caseId/participants", authenticate, getParticipants);

export default router;
