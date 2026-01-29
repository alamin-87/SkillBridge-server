import { Router } from "express";
import { TutorCategoryController } from "./tutorCategory.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();

// assign category to tutor (TUTOR only)
router.post(
  "/",
  authMiddleWare(UserRole.TUTOR),
  TutorCategoryController.create
);

// get all categories of a tutor profile (public or protected – your choice)
router.get(
  "/:tutorProfileId",
  TutorCategoryController.getAll
);
router.delete(
  "/:tutorProfileId/:categoryId",
  TutorCategoryController.deleteOne
);

export const TutorCategoryRoutes = router;
