import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";
import AppError from "../errorHelpers/AppError";

/**
 * Middleware to validate request body with Zod schema
 * @param zodSchema - Zod schema to validate against
 */
export const validateRequest = (zodSchema: ZodTypeAny): any => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // If the request body has a 'data' field as string, parse it
      if (req.body?.data && typeof req.body.data === "string") {
        try {
          req.body = JSON.parse(req.body.data);
        } catch (err) {
          throw new AppError(400, "Invalid JSON in request data field");
        }
      }

      const parsedResult = zodSchema.safeParse(req.body);

      if (!parsedResult.success) {
        // Extract readable Zod errors
        const errorMessages = parsedResult.error.issues.map(
          (e: any) => `${e.path.join(".")}: ${e.message}`
        );
        throw new AppError(400, "Validation Error", errorMessages);
      }

      // Overwrite request body with sanitized and validated data
      req.body = parsedResult.data;

      next();
    } catch (error) {
      next(error);
    }
  };
};