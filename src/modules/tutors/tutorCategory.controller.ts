import type { Request, Response } from "express";
import { TutorCategoryService } from "./tutorCategory.service";

export const TutorCategoryController = {
  create: async (req: Request, res: Response) => {
    const { tutorProfileId, categoryId } = req.body;

    if (typeof tutorProfileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId must be a string",
      });
    }

    if (typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a string",
      });
    }

    const data = await TutorCategoryService.createTutorCategory(
      tutorProfileId,
      categoryId,
    );

    return res.status(201).json({
      success: true,
      message: "Category assigned to tutor",
      data,
    });
  },

  getAll: async (req: Request, res: Response) => {
    const { tutorProfileId } = req.params;

    const data = await TutorCategoryService.getAllTutorCategories(
      tutorProfileId as string,
    );

    res.status(200).json({
      success: true,
      data,
    });
  },
  update: async (req: Request, res: Response) => {
    const data = await TutorCategoryService.updateCategory(
      req.params.id as string,
      req.body.name,
    );
    res.json({ success: true, message: "Category updated", data });
  },
  deleteOne: async (req: Request, res: Response) => {
    const { tutorProfileId, categoryId } = req.params;

    if (typeof tutorProfileId !== "string" || typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId and categoryId must be strings",
      });
    }

    try {
      const data = await TutorCategoryService.deleteTutorCategory(
        tutorProfileId,
        categoryId,
      );
      return res.status(200).json({
        success: true,
        message: "Category removed from tutor successfully",
        data,
      });
    } catch (err: any) {
      // Prisma throws if record not found
      return res.status(404).json({
        success: false,
        message: "Tutor category link not found",
      });
    }
  },
};
