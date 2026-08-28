import { Router } from "express";
import {
  grantPermission,
  revokePermission,
  checkPermission,
  listUserPermissions
} from "./authorization.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/cases/:caseId/permissions", grantPermission);
router.delete("/cases/:caseId/permissions", revokePermission);
router.get("/cases/:caseId/permissions/check", checkPermission);
router.get("/cases/:caseId/users/:userId/permissions", listUserPermissions);

export default router;
