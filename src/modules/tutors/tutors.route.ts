import express from "express";
import { UserRole } from "../../types/user/userType";
import { TutorsController } from "./tutors.controller";
import authMiddleware from "../../middleware/checkAuth";
const router = express.Router();
router.get("/", TutorsController.getAll);
router.get(
  "/profile",
  authMiddleware(UserRole.TUTOR),
  TutorsController.getMyTutorProfile,
);
router.get("/:id", TutorsController.getTutorById);
router.post(
  "/",
  authMiddleware(UserRole.TUTOR, UserRole.ADMIN),
  TutorsController.createPost,
);
router.patch(
  "/profile",
  authMiddleware(UserRole.TUTOR),
  TutorsController.updateTutorProfile,
);
export const tutorsRouter = router;
