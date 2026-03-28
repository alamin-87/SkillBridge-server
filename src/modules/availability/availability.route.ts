import { Router } from "express";
import { AvailabilityController } from "./availability.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Create new availability slots (Tutor only)
router.post(
  "/availability",
  authMiddleWare(UserRole.TUTOR),
  AvailabilityController.create
);

// Get all availability slots for a specific tutor profile
router.get(
  "/availability/:tutorProfileId",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  AvailabilityController.getAll
);

// Update a specific availability slot
router.patch(
  "/tutor/availability/:id",
  authMiddleWare(UserRole.TUTOR),
  AvailabilityController.update
);

// Remove a specific availability slot
router.delete(
  "/availability/:id",
  authMiddleWare(UserRole.TUTOR),
  AvailabilityController.remove
);

export const AvailabilityRoutes = router;
