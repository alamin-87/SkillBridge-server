import type { Request, Response } from "express";
import { AdminService } from "./admin.service";

export const AdminController = {
  getDashboardStats: async (_req: Request, res: Response) => {
    const data = await AdminService.getDashboardStats();
    res.json({ success: true, data });
  },
  getAllUsers: async (_req: Request, res: Response) => {
    const data = await AdminService.getAllUsers();
    res.json({ success: true, data });
  },
  updateUserStatusOrRole: async (req: Request, res: Response) => {
    const { status, role } = req.body;
    if (status !== undefined && status !== "ACTIVE" && status !== "BANNED") {
      return res.status(400).json({
        success: false,
        message: "status must be ACTIVE or BANNED",
      });
    }
    if (role !== undefined && role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "role must be STUDENT, TUTOR or ADMIN",
      });
    }

    const data = await AdminService.updateUser(req.params.id as string, { status, role });

    res.json({
      success: true,
      message: "User updated",
      data,
    });
  },

  getAllBookings: async (_req: Request, res: Response) => {
    const data = await AdminService.getAllBookings();
    res.json({ success: true, data });
  },

  getAllCategories: async (_req: Request, res: Response) => {
    const data = await AdminService.getAllCategories();
    res.json({ success: true, data });
  },

  createCategory: async (req: Request, res: Response) => {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name must be a non-empty string",
      });
    }

    const data = await AdminService.createCategory(name.trim());
    res.status(201).json({ success: true, message: "Category created", data });
  },

  updateCategory: async (req: Request, res: Response) => {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name must be a non-empty string",
      });
    }

    const data = await AdminService.updateCategory(req.params.id as string, name.trim());
    res.json({ success: true, message: "Category updated", data });
  },

  deleteCategory: async (req: Request, res: Response) => {
    const data = await AdminService.deleteCategory(req.params.id as string);
    res.json({ success: true, message: "Category deleted", data });
  },
};
