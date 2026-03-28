import { Router } from "express";
import { AssignmentController } from "./assignment.controller";
import authMiddleWare from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";
import { multerUpload } from "../../config/multer.config";

const router = Router();

// Tutors create a new assignment (give a question)
router.post(
  "/",
  authMiddleWare(UserRole.TUTOR),
  AssignmentController.createAssignment
);

// Get assignments
router.get(
  "/",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  AssignmentController.getAllAssignments
);

// Get a specific assignment with its submissions
router.get(
  "/:id",
  authMiddleWare(UserRole.TUTOR, UserRole.STUDENT, UserRole.ADMIN),
  AssignmentController.getAssignmentDetails
);

// Student submitting answers (uploading PDF or Image files)
router.post(
  "/:id/submit",
  authMiddleWare(UserRole.STUDENT),
  multerUpload.array("files", 5),
  AssignmentController.submitAssignment
);

// Tutor evaluates (grades) an assignment submission
router.patch(
  "/:assignmentId/submissions/:submissionId/evaluate",
  authMiddleWare(UserRole.TUTOR),
  AssignmentController.evaluateSubmission
);

export const AssignmentRoutes = router;
