import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createOrganization,
  createRole,
  createUser,
  getOrganizationUsers,
  getAllRegisteredOfficers,
  getAllOrganizations
} from "./organization.controller";

const router = Router();

router.get("/", getAllOrganizations);
router.get("/officers/all", getAllRegisteredOfficers);
router.post("/", createOrganization);

router.post("/:organizationId/roles", authenticate, createRole);
router.post("/:organizationId/users", authenticate, createUser);
router.get("/:organizationId/users", authenticate, getOrganizationUsers);

export default router;


