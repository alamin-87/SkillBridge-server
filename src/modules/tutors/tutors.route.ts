import express from "express";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";
import { TutorsController } from "./tutors.controller";
const router = express.Router();
router.get("/", TutorsController.getAll);
router.get(
  "/profile",
  authMiddleWare(UserRole.TUTOR),
  TutorsController.getMyTutorProfile,
);
router.get("/:id", TutorsController.getTutorById);
router.post(
  "/",
  authMiddleWare(UserRole.TUTOR, UserRole.ADMIN),
  TutorsController.createPost,
);
router.patch(
  "/profile",
  authMiddleWare(UserRole.TUTOR),
  TutorsController.updateTutorProfile,
);
export const tutorsRouter = router;
