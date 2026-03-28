/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import { auth } from "../lib/auth";
import type { UserRole } from "../../generated/prisma/enums";
import AppError from "../errorHelpers/AppError";
import type { IRequestUser } from "../interfaces/requestUser.interface";
import { prisma } from "../lib/prisma";

// 🔹 Middleware Factory (Role-based)
const authMiddleware = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔐 Get session from auth provider
      // Support both cookie-based sessions and bearer token authentication
      const session = await auth.api.getSession({
        headers: {
          cookie: req.headers.cookie || "",
          authorization: req.headers.authorization || "",
        },
      });

      // ❌ No session
      if (!session?.user?.id) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
      }



      // Query database for full user with custom fields
      // Always use the session's user ID as the source of truth
      let dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });



      // If user doesn't exist in database, that's an error at this point
      // (registration should have created the record)
      if (!dbUser) {
        // Try finding by email as fallback, but only for compatibility
        if (session.user.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
        }

        if (!dbUser) {
          throw new AppError(
            status.NOT_FOUND,
            "User not found. Please complete registration."
          );
        }
      }

      // Sync emailVerified status from Better Auth session to database if they differ
      if (session.user.emailVerified && !dbUser.emailVerified) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { emailVerified: true },
        });
      }

      if (dbUser.isDeleted) {
        throw new AppError(status.FORBIDDEN, "User account has been deleted");
      }

      if (dbUser.status !== "ACTIVE") {
        throw new AppError(status.FORBIDDEN, "Account is inactive");
      }

      // 🔹 Attach user to request
      const user: IRequestUser = {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role as UserRole,
        emailVerified: dbUser.emailVerified || session.user.emailVerified || false,
      };

      req.user = user;

      // 🔒 Email verification check (only for protected routes)
      if (!user.emailVerified) {
        throw new AppError(status.FORBIDDEN, "Email not verified");
      }

      // 🔒 Role-based authorization
      if (roles.length && !roles.includes(user.role)) {
        throw new AppError(
          status.FORBIDDEN,
          "You are not authorized to access this resource"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authMiddleware;