import { Router } from "express";
import { NotificationController } from "./notification.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Middleware: All notification routes require authentication
router.use(authMiddleWare(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN));

// Get all notifications for the authenticated user
router.get(
  "/",
  NotificationController.getMyNotifications
);

// Mark all notifications as read for the user
router.patch(
  "/read-all",
  NotificationController.markAllAsRead
);

// Mark a specific notification as read
router.patch(
  "/:id/read",
  NotificationController.markAsRead
);

// (Admin only) Send a system notification to a specific user
router.post(
  "/",
  authMiddleWare(UserRole.ADMIN),
  NotificationController.createSystemNotification
);

export const NotificationRoutes = router;
