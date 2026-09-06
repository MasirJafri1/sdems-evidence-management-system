import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import {
  createOrganization,
  createRole,
  createUser,
  createStandaloneUser,
  getOrganizationUsers,
  getAllRegisteredOfficers,
  getAllOrganizations,
  lookupUser,
  getSuperAdminAllData,
  getSuperAdminUsers,
  getSuperAdminOrganizations
} from "./organization.controller";

const router = Router();

// Super Admin Direct Visibility & Control APIs
router.get("/superadmin/all", authenticate, getSuperAdminAllData);
router.get("/superadmin/users", authenticate, getSuperAdminUsers);
router.get("/superadmin/organizations", authenticate, getSuperAdminOrganizations);

router.get("/", authenticate, getAllOrganizations);
router.get("/officers/all", authenticate, getAllRegisteredOfficers);
router.post("/users/lookup", authenticate, lookupUser);
router.post("/users/standalone", authenticate, createStandaloneUser);
router.post("/", authenticate, createOrganization);

router.post("/:organizationId/roles", authenticate, createRole);
router.post("/:organizationId/users", authenticate, createUser);
router.get("/:organizationId/users", authenticate, getOrganizationUsers);

export default router;
