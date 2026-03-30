import { Router } from "express";
import { UserController } from "./user.controller";
import  authMiddleWare  from "../../middleware/checkAuth";
import { UserRole } from "../../types/user/userType";
import { validateRequest } from "../../middleware/validateRequest";
import { updateUserSchema } from "./user.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get(
  "/me",
  authMiddleWare(),
  UserController.getMe
);

router.get(
  "/:id",
  authMiddleWare(),
  UserController.getById
);
router.patch(
  "/me",
  authMiddleWare(),
   multerUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
  ]),
  validateRequest(updateUserSchema),
  UserController.updateUser
);

router.delete("/me", authMiddleWare(), UserController.deleteUser);

export const UserRoutes = router;
