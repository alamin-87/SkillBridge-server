import type { Request, Response } from "express";
import { AdminService } from "./admin.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const AdminController = {
  getAllUsers: catchAsync(async (req: Request, res: Response) => {
    const { search, role, status: userStatus, page, limit } = req.query as Record<string, string>;
    const query: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {};
    if (search) query.search = search;
    if (role) query.role = role;
    if (userStatus) query.status = userStatus;
    if (page) query.page = parseInt(page);
    if (limit) query.limit = parseInt(limit);

    const data = await AdminService.getAllUsers(query);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Users retrieved successfully",
      data,
    });
  }),

  getUserDetails: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.getUserDetails(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User details retrieved successfully",
      data,
    });
  }),

  updateUserStatusOrRole: catchAsync(async (req: Request, res: Response) => {
    const { status: userStatus, role } = req.body;
    
    if (userStatus && userStatus !== "ACTIVE" && userStatus !== "BANNED") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "status must be ACTIVE or BANNED",
      });
    }
    
    if (role && role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "role must be STUDENT, TUTOR or ADMIN",
      });
    }

    const data = await AdminService.updateUser(req.params.id as string, { status: userStatus, role });
    
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User updated successfully",
      data,
    });
  }),

  updateUserStatus: catchAsync(async (req: Request, res: Response) => {
    const { status: userStatus } = req.body;
    if (userStatus !== "ACTIVE" && userStatus !== "BANNED") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "status must be ACTIVE or BANNED",
      });
    }

    const data = await AdminService.updateUser(req.params.id as string, { status: userStatus });
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User status updated successfully",
      data,
    });
  }),

  updateUserRole: catchAsync(async (req: Request, res: Response) => {
    const { role } = req.body;
    if (role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "role must be STUDENT, TUTOR or ADMIN",
      });
    }

    const data = await AdminService.updateUser(req.params.id as string, { role });
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User role updated successfully",
      data,
    });
  }),

  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.deleteUser(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "User permanently deleted",
      data,
    });
  }),

  getAllBookings: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllBookings();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Bookings retrieved successfully",
      data,
    });
  }),

  deleteBooking: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.deleteBooking(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Booking thoroughly deleted",
      data,
    });
  }),

  getAllCategories: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllCategories();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Categories retrieved successfully",
      data,
    });
  }),

  createCategory: catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Category name must be a non-empty string",
      });
    }

    const data = await AdminService.createCategory(name.trim());
    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Category created successfully",
      data,
    });
  }),

  updateCategory: catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Category name must be a non-empty string",
      });
    }

    const data = await AdminService.updateCategory(req.params.id as string, name.trim());
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Category updated successfully",
      data,
    });
  }),

  deleteCategory: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.deleteCategory(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Category deleted securely",
      data,
    });
  }),

  getAllPayments: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllPayments();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Comprehensive payments log retrieved",
      data,
    });
  }),

  getAllReviews: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllReviews();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Comprehensive reviews retrieved securely",
      data,
    });
  }),

  deleteReview: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.deleteReview(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Inappropriate review deleted successfully resolving global ranks",
      data,
    });
  }),

  getAllAssignments: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllAssignments();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Assignments retrieved successfully",
      data,
    });
  }),

  deleteAssignment: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.deleteAssignment(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Assignment deleted successfully",
      data,
    });
  }),

  // ─── Booking Status Update ────────────────────────────────────────
  updateBookingStatus: catchAsync(async (req: Request, res: Response) => {
    const { status: bookingStatus } = req.body;
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

    if (!validStatuses.includes(bookingStatus)) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const data = await AdminService.updateBookingStatus(
      req.params.id as string,
      bookingStatus
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: `Booking status updated to ${bookingStatus}`,
      data,
    });
  }),

  // ─── Notification Management ──────────────────────────────────────
  getAllNotifications: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllNotifications();
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "All notifications retrieved successfully",
      data,
    });
  }),

  deleteNotification: catchAsync(async (req: Request, res: Response) => {
    const data = await AdminService.deleteNotification(req.params.id as string);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Notification deleted successfully",
      data,
    });
  }),

  sendBroadcastNotification: catchAsync(async (req: Request, res: Response) => {
    const { title, message } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Both title and message are required",
      });
    }

    const data = await AdminService.sendBroadcastNotification(
      title.trim(),
      message.trim()
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: `Broadcast notification sent to ${data.sentTo} users`,
      data,
    });
  }),

  sendNotificationToUser: catchAsync(async (req: Request, res: Response) => {
    const { userId, title, message } = req.body;

    if (!userId || !title?.trim() || !message?.trim()) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "userId, title, and message are all required",
      });
    }

    const data = await AdminService.sendNotificationToUser(
      userId,
      title.trim(),
      message.trim()
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Notification sent to user",
      data,
    });
  }),
};
