
import { Router } from "express";

import {
  getMe,
  login,
  register,
} from "./auth.controller.js";

import { authenticateToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);

export default router;