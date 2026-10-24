
import { Router } from "express";

import {
  createService,
  getCategories,
  getServices,
} from "./service.controller.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/categories", getCategories);
router.get("/", getServices);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("PROVIDER"),
  createService,
);

export default router;