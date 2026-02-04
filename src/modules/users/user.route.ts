import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleWare } from "../../middleware/auth";

const router = Router();

router.get("/me", UserController.get);
router.patch("/me", UserController.update);

export const UserRoutes = router;
