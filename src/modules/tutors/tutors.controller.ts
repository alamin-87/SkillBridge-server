import type { Request, Response } from "express";
import type { TutorListQuery } from "./tutors.service";
import { TutorsService } from "./tutors.service";

const getAll = async (req: Request, res: Response) => {
  const { search, searchTerm, categoryId, minRating, maxPrice, page, limit, sortBy } =
    req.query;

  const q: TutorListQuery = {};
  if (typeof search === "string") q.search = search;
  if (typeof searchTerm === "string") q.searchTerm = searchTerm;
  if (typeof categoryId === "string") q.categoryId = categoryId;
  if (minRating !== undefined && minRating !== "") {
    q.minRating = Number(minRating);
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    q.maxPrice = Number(maxPrice);
  }
  if (page !== undefined && page !== "") q.page = Number(page);
  if (limit !== undefined && limit !== "") q.limit = Number(limit);
  if (typeof sortBy === "string") q.sortBy = sortBy;

  const data = await TutorsService.getAllTutors(q);

  res.json({ success: true, ...data });
};

const getTutorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await TutorsService.getTutorById(id as string);
  res.json({ success: true, data });
};

const getMyTutorProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const data = await TutorsService.getMyTutorProfile(userId);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res
      .status(404)
      .json({ success: false, message: "Tutor profile not found" });
  }
};

export const TutorsController = {
  getTutorById,
  getAll,
  getMyTutorProfile,
};
