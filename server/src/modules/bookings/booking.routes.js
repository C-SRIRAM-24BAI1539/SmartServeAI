
import { Router } from "express";

import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
} from "./booking.controller.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get(
  "/",
  authorizeRoles("CUSTOMER", "PROVIDER", "ADMIN"),
  getMyBookings,
);

router.post(
  "/",
  authorizeRoles("CUSTOMER"),
  createBooking,
);

router.patch(
  "/:id/status",
  authorizeRoles("CUSTOMER", "PROVIDER"),
  updateBookingStatus,
);

export default router;