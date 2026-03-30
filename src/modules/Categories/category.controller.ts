import type { Request, Response } from "express";
import { CategoryService } from "./category.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const CategoryController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Category name must be a string",
      });
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Category name is required",
      });
    }

    const data = await CategoryService.createCategory(trimmedName);

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Category created successfully by Admin",
      data,
    });
  }),

  getAll: catchAsync(async (req: Request, res: Response) => {
    const data = await CategoryService.getAllCategories(req.query);
    
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Categories retrieved successfully",
      meta: data.meta,
      data: data.data,
    });
  }),

  linkCategories: catchAsync(async (req: Request, res: Response) => {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "categoryIds must be an array of strings",
      });
    }

    if (categoryIds.length > 3) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "A tutor can choose a maximum of 3 categories",
      });
    }

    // ensuring uniqueness using Set and they are all strings
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    const areAllStrings = uniqueCategoryIds.every((id) => typeof id === "string");

    if (!areAllStrings) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "All category IDs must be valid strings",
      });
    }

    const data = await CategoryService.linkTutorCategories(
      req.user!.userId,
      uniqueCategoryIds
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Categories linked to your tutor profile successfully",
      data,
    });
  }),
};
