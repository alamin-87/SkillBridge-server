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
router.patch("/users/:id", AdminController.updateUserStatusOrRole); // Kept for backwards compatibility
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.patch("/users/:id/role", AdminController.updateUserRole);
router.delete("/users/:id", AdminController.deleteUser);

// Booking Management
router.get("/bookings", AdminController.getAllBookings);
router.delete("/bookings/:id", AdminController.deleteBooking);

// Category Management natively handled by core Admin capabilities
router.get("/categories", AdminController.getAllCategories);
router.post("/categories", AdminController.createCategory);
router.patch("/categories/:id", AdminController.updateCategory);
router.delete("/categories/:id", AdminController.deleteCategory);

export const AdminRoutes = router;
