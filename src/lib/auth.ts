// config/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";
import { envVars } from "../config/env";

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email/Password auth
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
  },

  // Social login (Google)
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: () => ({
        role: UserRole.STUDENT, // Default role for Google users
        status: UserStatus.ACTIVE,
        emailVerified: true,
        isDeleted: false,
      }),
    },
  },

  // Email verification settings
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
  },

  // User fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STUDENT,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      emailVerified: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null,
      },
    },
  },

  // Plugins
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[AUTH] Sending OTP for ${email}, type: ${type}`);
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (user && user.role === UserRole.ADMIN) {
          console.log(
            `User with email ${email} is a super admin. Skipping sending verification OTP.`,
          );
          return;
        }

        if (type === "email-verification") {
          await sendEmail({
            to: email,
            subject: "SkillBridge Email Verification",
            templateName: "otp",
            templateData: { name: user?.name || "Welcome", otp },
          });
        }

        if (type === "forget-password") {
          if (!user) return; // Only block if it's forget password and user doesn't exist
          await sendEmail({
            to: email,
            subject: "SkillBridge Password Reset OTP",
            templateName: "otp",
            templateData: { name: user?.name || "User", otp },
          });
        }
      },
      expiresIn: 2 * 60, // 2 minutes
      otpLength: 6,
    }),
  ],

  // Session settings
  session: {
    expiresIn: 24 * 60 * 60, // 1 day
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: false,
      maxAge: 0,
    },
  },

  // Redirect after social login
  redirectURLs: {
    signIn: `${envVars.FRONTEND_URL}/auth/success`,
  },

  // Trusted origins for CORS / cookies
  trustedOrigins: [
    "http://localhost:3000",
    envVars.APP_URL,
    "https://skillbridge-client-delta.vercel.app",
  ].filter(Boolean),

  // Advanced cookie settings
  advanced: {
    useSecureCookies: isProd,
    cookiePrefix: "skillbridge-auth",
    crossSubDomainCookies: {
      enabled: false,
    },
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: isProd,
          httpOnly: true,
          path: "/",
        },
      },
      sessionToken: {
        attributes: {
          sameSite: "none",
          secure: isProd,
          httpOnly: true,
          path: "/",
        },
      },
    },
    disableCSRFCheck: true, // optional, can enable later
  },
});
