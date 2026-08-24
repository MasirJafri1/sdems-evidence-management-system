import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { bootstrap } from "./bootstrap.controller";
import {
  createOrganization,
  createRole,
  createUser,
  getOrganizationUsers
} from "./organization.controller";

const router = Router();

router.post("/bootstrap", bootstrap);
router.post("/", createOrganization);
router.post("/:organizationId/roles", authenticate, createRole);
router.post("/:organizationId/users", authenticate, createUser);
router.get("/:organizationId/users", authenticate, getOrganizationUsers);

export default router;
