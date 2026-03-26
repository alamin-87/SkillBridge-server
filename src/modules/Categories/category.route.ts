import { Router } from "express";
import { CategoryController } from "./category.controller";
import { UserRole } from "../../types/user/userType";
import authMiddleware from "../../middleware/checkAuth";

const router = Router();
router.get("/", CategoryController.getAll);
router.post("/", authMiddleware(UserRole.TUTOR), CategoryController.create);

export const CategoryRoutes = router;
