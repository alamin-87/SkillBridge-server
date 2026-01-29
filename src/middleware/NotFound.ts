import type { Request, Response } from "express";

export function NotFound(req: Request, res: Response) {
  res.status(404).json({
    message: "Resource not found",
    status: 404,
    path: req.originalUrl,
    date: new Date().toISOString(),
  });
}
