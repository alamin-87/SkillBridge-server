import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

router.get("/me",authMiddleWare(UserRole.STUDENT), UserController.get);
router.patch("/me",authMiddleWare(UserRole.STUDENT), UserController.update);

export const UserRoutes = router;
