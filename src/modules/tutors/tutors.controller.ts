import type { NextFunction, Request, Response } from "express";
import { TutorsService } from "./tutors.service";

const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.user);
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await TutorsService.createTutor(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
const getAll = async (req: Request, res: Response) => {
  const { search, categoryId, minRating, maxPrice, page, limit } = req.query;

  const data = await TutorsService.getAllTutors({
    search: search as string | undefined,
    categoryId: categoryId as string | undefined,
    minRating: minRating ? Number(minRating) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json({ success: true, ...data });
};
const getTutorById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await TutorsService.getTutorById(id as string);
  res.json({ success: true, data });
};
const getMyTutorProfile = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const data = await TutorsService.getMyTutorProfile(id as string);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res
      .status(404)
      .json({ success: false, message: "Tutor profile not found" });
  }
};
const updateTutorProfile = async (req: Request, res: Response) => {
  const id = req.user?.id;
  if (!id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const data = await TutorsService.updateTutorProfile(id, req.body);
  res.json({ success: true, message: "Tutor profile updated", data });
};

export const TutorsController = {
  createPost,
  getTutorById,
  getAll,
  getMyTutorProfile,
  updateTutorProfile,
};
