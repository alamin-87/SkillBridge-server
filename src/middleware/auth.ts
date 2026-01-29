import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import type { UserRole } from "../types/user/userType";

declare global {
  namespace Express {
    interface Request {
      // auth?: { user: any };
      user?: {
        id: string;
        email: string;
        role: string;
        emailVerified: boolean;
      };
    }
  }
}
const authMiddleWare = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });
      if (!session || !session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role as string,
        emailVerified: session.user.emailVerified,
      };
      if (roles.length && !roles.includes(req.user.role as UserRole)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      console.log(session);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export { authMiddleWare };
