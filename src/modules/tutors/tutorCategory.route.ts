import { Router } from "express";
import authMiddleware from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserRole } from "../../types/user/userType";
import { TutorCategoryController } from "./tutorCategory.controller";
import {
  createTutorCategoryValidation,
  deleteTutorCategoryValidation,
  listTutorCategoriesValidation,
  updateTutorCategoryValidation,
} from "./tutorCategory.validation";

const router = Router();

router.get(
  "/:tutorProfileId",
  validateRequest(listTutorCategoriesValidation),
  TutorCategoryController.getAll,
);

router.post(
  "/",
  authMiddleware(UserRole.TUTOR),
  validateRequest(createTutorCategoryValidation),
  TutorCategoryController.create,
);

router.patch(
  "/:tutorProfileId/:categoryId",
  authMiddleware(UserRole.TUTOR),
  validateRequest(updateTutorCategoryValidation),
  TutorCategoryController.update,
);

router.delete(
  "/:tutorProfileId/:categoryId",
  authMiddleware(UserRole.TUTOR),
  validateRequest(deleteTutorCategoryValidation),
  TutorCategoryController.deleteOne,
);

export const TutorCategoryRoutes = router;
