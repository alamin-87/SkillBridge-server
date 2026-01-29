
import type { Request, Response } from "express";
import { ReviewService } from "./review.service";

export const ReviewController = {
  create: async (req: Request, res: Response) => {
    const { bookingId, rating, comment } = req.body;

    if (typeof bookingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "bookingId must be a string",
      });
    }

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be an integer between 1 and 5",
      });
    }

    if (comment !== undefined && typeof comment !== "string") {
      return res.status(400).json({
        success: false,
        message: "comment must be a string (if provided)",
      });
    }

    const data = await ReviewService.createReview(req.user!.id, {
      bookingId,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data,
    });
  },
    getAllByTutor: async (req: Request, res: Response) => {
    const { tutorId } = req.params;

    if (typeof tutorId !== "string") {
      return res.status(400).json({ success: false, message: "tutorId must be a string" });
    }

    const data = await ReviewService.getTutorReviews(tutorId);

    return res.status(200).json({ success: true, data });
  },

  // ✅ student only
  getAllMine: async (req: Request, res: Response) => {
    const data = await ReviewService.getMyReviews(req.user!.id);
    return res.status(200).json({ success: true, data });
  },
};
