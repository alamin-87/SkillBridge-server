import type { Request, Response } from "express";
import { BookingService } from "./booking.service";
import type { UserRole } from "../../types/user/userType";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const BookingController = {
  create: catchAsync(async (req: Request, res: Response) => {
    // Note: The price is no longer strictly required from the client 
    // as we now calculate a 30-day package on the backend using the tutor's rate.
    const {
      tutorProfileId,
      tutorId,
      availabilityId,
      scheduledStart,
      scheduledEnd,
    } = req.body;

    if (typeof tutorProfileId !== "string" || typeof tutorId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "tutorProfileId and tutorId must be valid strings",
      });
    }

    if (availabilityId !== undefined && typeof availabilityId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "availabilityId must be a string (if provided)",
      });
    }

    if (
      typeof scheduledStart !== "string" ||
      typeof scheduledEnd !== "string"
    ) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "scheduledStart and scheduledEnd must be strings",
      });
    }

    const data = await BookingService.createBooking(req.user!.userId, {
      tutorProfileId,
      tutorId,
      availabilityId,
      scheduledStart,
      scheduledEnd,
    });

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "30-day recurring booking package created successfully",
      data,
    });
  }),

  getAll: catchAsync(async (req: Request, res: Response) => {
    const role = req.user?.role;
    const data = await BookingService.getAllBookings(req.user!.userId, role);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Bookings retrieved successfully",
      data,
    });
  }),

  get: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = req.user?.role;
    const data = await BookingService.getBooking(
      id as string,
      req.user!.userId,
      role
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Booking retrieved successfully",
      data,
    });
  }),

  cancel: catchAsync(async (req: Request, res: Response) => {
    const { reason } = req.body as { reason?: string };

    if (reason !== undefined && typeof reason !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "reason must be a string (if provided)",
      });
    }
    const { id } = req.params;

    const data = await BookingService.cancelBooking(
      id as string,
      req.user!.userId,
      req.user!.role as UserRole,
      reason
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Booking cancelled successfully",
      data,
    });
  }),

  complete: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await BookingService.completeBooking(
      id as string,
      req.user!.userId
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Booking marked as completed",
      data,
    });
  }),
};