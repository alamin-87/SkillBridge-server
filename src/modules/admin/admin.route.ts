import { Router } from "express";
import { AdminController } from "./admin.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Apply strict ADMIN access control universally for all routes below
router.use(authMiddleWare(UserRole.ADMIN));

// User Management
router.get("/users", AdminController.getAllUsers);
router.get("/users/:id", AdminController.getUserDetails);
router.patch("/users/:id", AdminController.updateUserStatusOrRole);
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.patch("/users/:id/role", AdminController.updateUserRole);
router.delete("/users/:id", AdminController.deleteUser);

// Booking Management
router.get("/bookings", AdminController.getAllBookings);
router.patch("/bookings/:id/status", AdminController.updateBookingStatus);
router.delete("/bookings/:id", AdminController.deleteBooking);

// Category Management
router.get("/categories", AdminController.getAllCategories);
router.post("/categories", AdminController.createCategory);
router.patch("/categories/:id", AdminController.updateCategory);
router.delete("/categories/:id", AdminController.deleteCategory);

// Notification Management
router.get("/notifications", AdminController.getAllNotifications);
router.delete("/notifications/:id", AdminController.deleteNotification);
router.post("/notifications/broadcast", AdminController.sendBroadcastNotification);
router.post("/notifications/send-to-user", AdminController.sendNotificationToUser);

// Payment Management
router.get("/payments", AdminController.getAllPayments);

// Review Moderation
router.get("/reviews", AdminController.getAllReviews);
router.delete("/reviews/:id", AdminController.deleteReview);

// Assignment Management
router.get("/assignments", AdminController.getAllAssignments);
router.delete("/assignments/:id", AdminController.deleteAssignment);

export const AdminRoutes = router;
