import { Router } from "express";
import { CategoryController } from "./category.controller";
import { UserRole } from "../../types/user/userType";
import authMiddleware from "../../middleware/checkAuth";

const router = Router();

// public route to list categories
router.get("/", CategoryController.getAll);

// only admin can create a category
router.post("/", authMiddleware(UserRole.ADMIN), CategoryController.create);

// tutor can link categories to their profile (max 3)
router.post("/link", authMiddleware(UserRole.TUTOR), CategoryController.linkCategories);

export const CategoryRoutes = router;
