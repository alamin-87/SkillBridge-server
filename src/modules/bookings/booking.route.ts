import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";


const router = Router();

router.post("/", authMiddleWare(UserRole.TUTOR), BookingController.create);
router.get("/", authMiddleWare(UserRole.TUTOR), BookingController.getAll);
router.get("/:id", authMiddleWare(UserRole.TUTOR), BookingController.get);

export const BookingRoutes = router;