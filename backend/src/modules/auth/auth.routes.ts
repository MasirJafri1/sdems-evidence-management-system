import { Router } from "express";
import { login, updateProfile } from "./auth.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.post("/login", login);
router.patch("/profile", authenticate, updateProfile);
router.put("/profile", authenticate, updateProfile);

export default router;
