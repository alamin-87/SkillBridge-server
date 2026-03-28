import { Router } from "express";
import { StatsController } from "./stats.controller";
import authMiddleware from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Student dashboard stats - only students can access their own dashboard
router.get(
  "/student",
  authMiddleware(UserRole.STUDENT),
  StatsController.getStudentDashboard
);

// Tutor dashboard stats - only tutors can access their own dashboard
router.get(
  "/tutor",
  authMiddleware(UserRole.TUTOR),
  StatsController.getTutorDashboard
);

// Admin dashboard stats - only admins can access the platform overview
router.get(
  "/admin",
  authMiddleware(UserRole.ADMIN),
  StatsController.getAdminDashboard
);

export const StatsRoutes = router;
