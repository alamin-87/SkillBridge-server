import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

router.post("/", authMiddleWare(UserRole.TUTOR,UserRole.STUDENT), BookingController.create);
router.get("/", authMiddleWare(UserRole.TUTOR,UserRole.STUDENT), BookingController.getAll);
router.get("/:id", authMiddleWare(UserRole.TUTOR,UserRole.STUDENT), BookingController.get);
router.patch(
  "/:id/cancel",
  authMiddleWare(UserRole.TUTOR),
  BookingController.cancel,
);
// tutor only
router.patch(
  "/:id/complete",
  authMiddleWare(UserRole.TUTOR),
  BookingController.complete,
);

export const BookingRoutes = router;
