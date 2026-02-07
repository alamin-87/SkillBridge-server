import { Router } from "express";
import { TutorCategoryController } from "./tutorCategory.controller";
import { authMiddleWare } from "../../middleware/auth";
import { UserRole } from "../../types/user/userType";

const router = Router();
router.get(
  "/:tutorProfileId",
  TutorCategoryController.getAll
);
router.post(
  "/",
  authMiddleWare(UserRole.TUTOR),
  TutorCategoryController.create
);
router.patch("/:tutorProfileId", authMiddleWare(UserRole.TUTOR), TutorCategoryController.update);
router.delete(
  "/:tutorProfileId/:categoryId",
  TutorCategoryController.deleteOne
);

export const TutorCategoryRoutes = router;
