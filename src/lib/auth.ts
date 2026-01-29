import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  trustedOrigins: [process.env.app_URL!, "http://localhost:3000"],
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
});
