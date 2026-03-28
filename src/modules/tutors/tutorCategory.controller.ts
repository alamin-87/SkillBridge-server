import type { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { TutorCategoryService } from "./tutorCategory.service";
import type { TutorCategoryListQuery } from "./tutorCategory.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const { tutorProfileId, categoryId } = req.body;
  const userId = req.user!.userId;

  const data = await TutorCategoryService.createTutorCategory(
    tutorProfileId,
    categoryId,
    userId,
  );

  return res.status(201).json({
    success: true,
    message: "Category assigned to tutor",
    data,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const tutorProfileId = req.params.tutorProfileId as string;
  const { page, limit, sortBy, searchTerm } = req.query;

  const q: TutorCategoryListQuery = {};
  if (typeof page === "number") q.page = page;
  if (typeof limit === "number") q.limit = limit;
  if (typeof sortBy === "string") q.sortBy = sortBy;
  if (typeof searchTerm === "string") q.searchTerm = searchTerm;

  const result = await TutorCategoryService.getAllTutorCategories(
    tutorProfileId,
    q,
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const tutorProfileId = req.params.tutorProfileId as string;
  const categoryId = req.params.categoryId as string;
  const { name } = req.body;
  const userId = req.user!.userId;

  const data = await TutorCategoryService.updateCategoryNameForTutor(
    tutorProfileId,
    categoryId,
    name,
    userId,
  );

  res.json({ success: true, message: "Category updated", data });
});

const deleteOne = catchAsync(async (req: Request, res: Response) => {
  const tutorProfileId = req.params.tutorProfileId as string;
  const categoryId = req.params.categoryId as string;
  const userId = req.user!.userId;

  const data = await TutorCategoryService.deleteTutorCategory(
    tutorProfileId,
    categoryId,
    userId,
  );

  return res.status(200).json({
    success: true,
    message: "Category removed from tutor successfully",
    data,
  });
});

export const TutorCategoryController = {
  create,
  getAll,
  update,
  deleteOne,
};
