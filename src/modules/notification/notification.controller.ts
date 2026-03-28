import type { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const NotificationController = {
  getMyNotifications: catchAsync(async (req: Request, res: Response) => {
    const data = await NotificationService.getUserNotifications(req.user!.userId);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Notifications retrieved successfully",
      data,
    });
  }),

  markAsRead: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const data = await NotificationService.markNotificationAsRead(
      id as string,
      req.user!.userId
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Notification marked as read",
      data,
    });
  }),

  markAllAsRead: catchAsync(async (req: Request, res: Response) => {
    const data = await NotificationService.markAllAsRead(req.user!.userId);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "All notifications marked as read",
      data,
    });
  }),

  createSystemNotification: catchAsync(async (req: Request, res: Response) => {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Required missing fields: userId, title, message",
      });
    }

    const data = await NotificationService.createNotification(
      userId,
      title,
      message,
      "SYSTEM"
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "System notification broadcasted mapping locally to specific user",
      data,
    });
  }),
};
