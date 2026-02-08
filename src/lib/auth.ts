import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.app_URL!, "https://skillbridge-client-black.vercel.app"],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE",
      },
    },
  },
    emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
  },
    socialProviders: {
    google: {
      prompt:"select_account consent",
       accessType: "offline", 
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  //   session: {
  //   cookieCache: {
  //     enabled: true,
  //     maxAge: 5 * 60, // 5 minutes
  //   },
  // },
  // advanced: {
  //   cookiePrefix: "better-auth",
  //   useSecureCookies: process.env.NODE_ENV === "production",
  //   crossSubDomainCookies: {
  //     enabled: false,
  //   },
  //   disableCSRFCheck: true, // Allow requests without Origin header (Postman, mobile apps, etc.)
  // },
});
