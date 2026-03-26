/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import { auth } from "../lib/auth";
import type { UserRole } from "../../generated/prisma/enums";
import AppError from "../errorHelpers/AppError";
import type { IRequestUser } from "../interfaces/requestUser.interface";

// 🔹 Middleware Factory (Role-based)
const authMiddleware = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔐 Get session from auth provider
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      // ❌ No session
      if (!session?.user) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
      }

      // 🔹 Attach user to request
      const user: IRequestUser = {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role as UserRole,
        emailVerified: session.user.emailVerified,
      };

      req.user = user;

      // 🔒 Email verification check
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