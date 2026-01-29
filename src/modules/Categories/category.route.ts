import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// Public
router.get("/", CategoryController.getAll);

// Admin only
router.post("/", authMiddleWare(UserRole.TUTOR), CategoryController.create);

export const CategoryRoutes = router;
