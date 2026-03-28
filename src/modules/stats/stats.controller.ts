import type { Request, Response } from "express";
import status from "http-status";
import { StatsService } from "./stats.service";
import { sendResponse } from "../../shared/sendResponse";
import catchAsync from "../../shared/catchAsync";
import AppError from "../../errorHelpers/AppError";

// ── Student Dashboard Stats ──
const getStudentDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "User not authenticated");
  }

  const data = await StatsService.getStudentStats(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Student dashboard stats retrieved successfully",
    data,
  });
});

// ── Tutor Dashboard Stats ──
const getTutorDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "User not authenticated");
  }

  const data = await StatsService.getTutorStats(userId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor dashboard stats retrieved successfully",
    data,
  });
});

// ── Admin Dashboard Stats ──
const getAdminDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "User not authenticated");
  }

  const data = await StatsService.getAdminStats();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin dashboard stats retrieved successfully",
    data,
  });
});

export const StatsController = {
  getStudentDashboard,
  getTutorDashboard,
  getAdminDashboard,
};
