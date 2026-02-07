import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();
router.get("/", CategoryController.getAll);
router.post("/", authMiddleWare(UserRole.TUTOR), CategoryController.create);

export const CategoryRoutes = router;
