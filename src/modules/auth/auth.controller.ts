import type { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import status from "http-status";
import { auth } from "../../lib/auth";
import { envVars } from "../../config/env";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Login successful",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req.user!.userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User fetched",
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.logoutUser(
    req.headers as Record<string, string>
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Logged out",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await AuthService.verifyEmail(email, otp);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Email verified",
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await AuthService.resendOtp(email);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "OTP resent",
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await AuthService.forgetPassword(email);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "OTP sent",
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  await AuthService.resetPassword(email, otp, newPassword);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Password reset successful",
  });
});

// GOOGLE LOGIN
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  // For manual testing: redirect directly to Google OAuth
  // You can test with: http://localhost:5000/api/v1/auth/login/google
  
  const googleAuthUrl = `${envVars.BETTER_AUTH_URL}/api/auth/sign-in/google`;
  
  // Directly redirect for manual testing
  // After Google OAuth completes, you'll be redirected to FRONTEND_URL/auth/success
  // Make sure FRONTEND_URL in .env is http://localhost:3000 or accessible
  res.redirect(googleAuthUrl);
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirect = (req.query.redirect as string) || "/dashboard";

  const session = await auth.api.getSession({
    headers: req.headers as Record<string, string>,
  });

  if (!session) {
    return res.redirect(`/login?error=session_failed`);
  }

  await AuthService.googleLoginSuccess(session);

  res.redirect(`${envVars.FRONTEND_URL}${redirect}`);
});

const handleOAuthError = catchAsync(async (req: Request, res: Response) => {
  const error = req.query.error || "oauth_failed";
  res.redirect(`/login?error=${error}`);
});

export const AuthController = {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  verifyEmail,
  resendOtp,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};