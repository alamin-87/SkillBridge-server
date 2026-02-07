import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

router.get("/me",authMiddleWare(UserRole.STUDENT,UserRole.ADMIN), UserController.get);
router.get(
  "/:id",
  authMiddleWare(UserRole.ADMIN,UserRole.TUTOR),
  UserController.getById
);
router.patch("/me",authMiddleWare(UserRole.STUDENT,UserRole.ADMIN), UserController.update);

export const UserRoutes = router;
