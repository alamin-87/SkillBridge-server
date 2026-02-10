
import type { Request, Response } from "express";
import { CategoryService } from "./category.service";

export const CategoryController = {
  create: async (req: Request, res: Response) => {
    const { name } = req.body;

    // type validation
    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category name must be a string",
      });
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const data = await CategoryService.createCategory(trimmedName);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data,
    });
  },

  getAll: async (_req: Request, res: Response) => {
    const data = await CategoryService.getAllCategories();
    return res.status(200).json({ success: true, data });
  },
};
