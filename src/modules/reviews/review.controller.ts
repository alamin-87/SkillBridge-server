import type { Request, Response } from "express";
import { ReviewService } from "./review.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const ReviewController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const { bookingId, rating, comment } = req.body;

    if (typeof bookingId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "bookingId must be a string",
      });
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "rating must be an integer between 1 and 5",
      });
    }

    if (comment !== undefined && typeof comment !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "comment must be a string (if provided)",
      });
    }

    const data = await ReviewService.createReview(req.user!.userId, {
      bookingId,
      rating,
      comment,
    });

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Review created successfully",
      data,
    });
  }),

  getAllByTutor: catchAsync(async (req: Request, res: Response) => {
    const { tutorId } = req.params;

    if (typeof tutorId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "tutorId must be a string",
      });
    }

    const data = await ReviewService.getTutorReviews(tutorId);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Tutor reviews retrieved successfully",
      data,
    });
  }),

  // student only
  getAllMine: catchAsync(async (req: Request, res: Response) => {
    const data = await ReviewService.getMyReviews(req.user!.userId);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Your reviews retrieved successfully",
      data,
    });
  }),
};
