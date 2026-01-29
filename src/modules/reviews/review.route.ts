import { Router } from "express";
import { ReviewController } from "./review.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

router.post("/", authMiddleWare(UserRole.TUTOR), ReviewController.create);
// public: list reviews of a tutor
router.get("/tutor/:tutorId", ReviewController.getAllByTutor);

// student: my reviews
router.get("/me", authMiddleWare(UserRole.TUTOR), ReviewController.getAllMine);

export const ReviewRoutes = router;
