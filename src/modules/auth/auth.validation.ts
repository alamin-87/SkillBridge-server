import { z } from "zod";

// Reusable password rule
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

// ─── Register ────────────────────────────────────────────────────────────────
export const registerUserValidation = z.object({
  body: z.object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Invalid email"),
    password: passwordSchema,
  }),
});

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginUserValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  }),
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmailValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtpValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
  }),
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
  }),
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: passwordSchema,
  }),
});