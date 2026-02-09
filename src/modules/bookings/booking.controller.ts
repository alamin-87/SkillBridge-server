import type { Request, Response } from "express";
import { BookingService } from "./booking.service";
import type { UserRole } from "../../types/user/userType";

export const BookingController = {
  create: async (req: Request, res: Response) => {
    const { tutorProfileId, tutorId, availabilityId, scheduledStart, scheduledEnd, price } = req.body;

    if (typeof tutorProfileId !== "string" || typeof tutorId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId and tutorId must be strings",
      });
    }

    if (availabilityId !== undefined && typeof availabilityId !== "string") {
      return res.status(400).json({
        success: false,
        message: "availabilityId must be a string (if provided)",
      });
    }

    if (typeof scheduledStart !== "string" || typeof scheduledEnd !== "string") {
      return res.status(400).json({
        success: false,
        message: "scheduledStart and scheduledEnd must be strings",
      });
    }

    if (typeof price !== "number") {
      return res.status(400).json({
        success: false,
        message: "price must be a number",
      });
    }

    const data = await BookingService.createBooking(req.user!.id, {
      tutorProfileId,
      tutorId,
      availabilityId,
      scheduledStart,
      scheduledEnd,
      price,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data,
    });
  },

  getAll: async (req: Request, res: Response) => {
    const role=req.user?.role
    const data = await BookingService.getAllBookings(req.user!.id, role);

    return res.status(200).json({
      success: true,
      data,
    });
  },

  get: async (req: Request, res: Response) => {
    const {id}=req.params
    const role=req.user?.role
    const data = await BookingService.getBooking(id as string, req.user!.id, role);

    return res.status(200).json({
      success: true,
      data,
    });
  },
    cancel: async (req: Request, res: Response) => {
    const { reason } = req.body as { reason?: string };

    if (reason !== undefined && typeof reason !== "string") {
      return res.status(400).json({
        success: false,
        message: "reason must be a string (if provided)",
      });
    }
     const {id}=req.params
    const data = await BookingService.cancelBooking(
      req.params.id as string,
      req.user!.id,
      req.user!.role as UserRole,
      reason
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data,
    });
  },

  complete: async (req: Request, res: Response) => {
    const data = await BookingService.completeBooking(req.params.id as string, req.user!.id);

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed",
      data,
    });
  },
};