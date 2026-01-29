import { Router } from "express";
import { AvailabilityController } from "./availability.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Tutor only
router.post("/availability", authMiddleWare(UserRole.TUTOR), AvailabilityController.create);
router.get("/availability/:tutorProfileId", authMiddleWare(UserRole.TUTOR), AvailabilityController.getAll);
router.patch("/tutor/availability/:id", authMiddleWare(UserRole.TUTOR), AvailabilityController.update);
router.delete("/availability/:id", authMiddleWare(UserRole.TUTOR), AvailabilityController.remove);

export const AvailabilityRoutes = router;
