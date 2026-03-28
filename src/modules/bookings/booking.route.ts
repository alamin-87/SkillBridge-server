import { Router } from "express";
import { BookingController } from "./booking.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Create 30-day recurring booking (student only generally, but kept existing roles)
router.post(
  "/",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  BookingController.create
);

// Get bookings
router.get(
  "/",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT),
  BookingController.getAll
);

// Get single booking
router.get(
  "/:id",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT),
  BookingController.get
);

// Cancel booking
router.patch(
  "/:id/cancel",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT), // upgraded to allow student
  BookingController.cancel
);

// Complete booking (tutor only)
router.patch(
  "/:id/complete",
  authMiddleWare(UserRole.TUTOR),
  BookingController.complete
);

export const BookingRoutes = router;
