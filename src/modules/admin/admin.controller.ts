import type { Request, Response } from "express";
import { AdminService } from "./admin.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const AdminController = {
  getAllUsers: catchAsync(async (_req: Request, res: Response) => {
    const data = await AdminService.getAllUsers();
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
};
