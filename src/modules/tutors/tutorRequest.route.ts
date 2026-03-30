import { Router } from "express";
import { TutorRequestController } from "./tutorRequest.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createTutorValidation,
  createTutorRequestValidation,
  rejectTutorRequestValidation,
  updateTutorValidation,
} from "./tutorRequest.validation";
import { UserRole } from "../../types/user/userType";
import { multerUpload, multerMemoryUpload } from "../../config/multer.config";

const router = Router();

// ─── Create Tutor (Admin only) ───────────────────────────────────────────────
router.post(
  "/",
  authMiddleWare(UserRole.ADMIN),
  validateRequest(createTutorValidation),
  TutorRequestController.createTutor
);

// ─── Request to become Tutor (Logged-in user) ───────────────────────────────
router.post(
  "/request",
  authMiddleWare(),
  validateRequest(createTutorRequestValidation),
  TutorRequestController.requestToBecomeTutor
);

// ─── Get my Tutor Request (Student) ─────────────────────────────────────────
router.get(
  "/my-request",
  authMiddleWare(),
  TutorRequestController.getMyTutorRequest
);

// ─── Get all Tutor Requests (Admin) ─────────────────────────────────────────
router.get(
  "/requests",
  authMiddleWare(UserRole.ADMIN),
  TutorRequestController.getAllTutorRequests
);

// ─── Get pending Tutor Requests (Admin) ─────────────────────────────────────
router.get(
  "/requests/pending",
  authMiddleWare(UserRole.ADMIN),
  TutorRequestController.getPendingTutorRequests
);

// ─── Approve Tutor Request (Admin) ──────────────────────────────────────────
router.patch(
  "/requests/:id/approve",
  authMiddleWare(UserRole.ADMIN),
  TutorRequestController.approveTutorRequest
);

// ─── Reject Tutor Request (Admin) ───────────────────────────────────────────
router.patch(
  "/requests/:id/reject",
  authMiddleWare(UserRole.ADMIN),
  validateRequest(rejectTutorRequestValidation),
  TutorRequestController.rejectTutorRequest
);

// ─── Update Tutor Profile (Tutor only) ──────────────────────────────────────
router.patch(
  "/profile",
  authMiddleWare(UserRole.TUTOR),
  multerMemoryUpload.fields([
    { name: "profileImage", maxCount: 1 },
  ]),
  validateRequest(updateTutorValidation),
  TutorRequestController.updateTutorProfile
);

export const TutorRequestRoutes = router;
