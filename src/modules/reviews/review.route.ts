import { Router } from "express";
import { ReviewController } from "./review.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// student can give a review
router.post("/", authMiddleWare(UserRole.STUDENT), ReviewController.create);

// public: list reviews of a tutor
router.get("/tutor/:tutorId", ReviewController.getAllByTutor);

// student: my reviews
router.get("/me", authMiddleWare(UserRole.STUDENT), ReviewController.getAllMine);

export const ReviewRoutes = router;
