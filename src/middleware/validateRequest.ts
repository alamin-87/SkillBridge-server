import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import AppError from "../errorHelpers/AppError";

/**
 * Middleware to validate request body with Zod schema
 * Schemas should be shaped as: z.object({ body: z.object({...}) })
 * Optionally supports params and query too.
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

      // Wrap req parts so schema shape { body, params, query } works correctly
      const parsedResult = zodSchema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (!parsedResult.success) {
        const errorMessages = parsedResult.error.issues.map(
          (e: any) => `${e.path.join(".")}: ${e.message}`
        );
        throw new AppError(400, "Validation Error", errorMessages);
      }

      // Overwrite request fields with sanitized and validated data
      const data = parsedResult.data as Record<string, any>;
      req.body = data.body;

      if (data.params) {
        req.params = data.params;
      }

      if (data.query) {
        req.query = data.query;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};