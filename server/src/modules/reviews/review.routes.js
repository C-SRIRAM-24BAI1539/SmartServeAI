
import { Router } from "express";
import {
  createReview,
  getProviderReviews,
} from "./review.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/provider/:providerId", getProviderReviews);

router.post(
  "/booking/:bookingId",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  createReview,
);

export default router;