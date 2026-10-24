
import { Router } from "express";

import {
  getProviders,
  updateProviderProfile,
} from "./provider.controller.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", getProviders);
router.patch(
  "/me",
  authenticateToken,
  authorizeRoles("PROVIDER"),
  updateProviderProfile,
);

export default router;