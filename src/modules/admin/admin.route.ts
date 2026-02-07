import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// ✅ /admin (Dashboard)
router.get("/", authMiddleWare(UserRole.ADMIN), AdminController.getDashboardStats);
// ✅ /admin/users
router.get("/users", authMiddleWare(UserRole.ADMIN), AdminController.getAllUsers);
// ✅ /admin/bookings
router.get("/bookings", authMiddleWare(UserRole.ADMIN), AdminController.getAllBookings);
// ✅ /admin/categories
router.get("/categories", authMiddleWare(UserRole.ADMIN), AdminController.getAllCategories);
router.post("/categories", authMiddleWare(UserRole.ADMIN), AdminController.createCategory);
router.patch("/users/:id", authMiddleWare(UserRole.ADMIN), AdminController.updateUserStatusOrRole);
router.patch("/categories/:id", authMiddleWare(UserRole.ADMIN), AdminController.updateCategory);
router.delete("/categories/:id", authMiddleWare(UserRole.ADMIN), AdminController.deleteCategory);

export const AdminRoutes = router;
