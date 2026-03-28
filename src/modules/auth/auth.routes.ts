import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { loginUserValidation, registerUserValidation } from "./auth.validation";
import authMiddleware from "../../middleware/checkAuth";

const router = Router();

router.post("/register", validateRequest(registerUserValidation), AuthController.registerUser);
router.post("/login",validateRequest(loginUserValidation), AuthController.loginUser);
router.get("/me", authMiddleware(), AuthController.getMe);
router.post("/logout", AuthController.logoutUser);

router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-otp", AuthController.resendOtp);

router.post("/forgot-password", AuthController.forgetPassword);
router.post("/reset-password", AuthController.resetPassword);

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRoute = router;