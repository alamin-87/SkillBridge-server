import type { Request, Response } from "express";
import { AvailabilityService } from "./availability.service";
import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

export const AvailabilityController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const { tutorProfileId, slots } = req.body;

    if (typeof tutorProfileId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "tutorProfileId must be a string",
      });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "slots must be a non-empty array",
      });
    }

    for (const slot of slots) {
      if (
        typeof slot.startTime !== "string" ||
        typeof slot.endTime !== "string"
      ) {
        return res.status(status.BAD_REQUEST).json({
          success: false,
          message: "Each slot must contain startTime and endTime as strings",
        });
      }

      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(status.BAD_REQUEST).json({
          success: false,
          message: "Invalid date format. Use ISO string (e.g. 2026-04-09T23:49:00Z)",
        });
      }

      if (end <= start) {
        return res.status(status.BAD_REQUEST).json({
          success: false,
          message: "endTime must be strictly greater than startTime",
        });
      }
    }

    const data = await AvailabilityService.createAvailability(
      tutorProfileId,
      slots
    );

    sendResponse(res, {
      httpStatusCode: status.CREATED,
      success: true,
      message: "Availability 30-day package created successfully",
      data,
    });
  }),

  getAll: catchAsync(async (req: Request, res: Response) => {
    const { tutorProfileId } = req.params;

    if (typeof tutorProfileId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "tutorProfileId must be a valid string",
      });
    }

    const data = await AvailabilityService.getAllAvailability(tutorProfileId);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Availability slots retrieved successfully",
      data,
    });
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const availabilityId = req.params.id;
    const { startTime, endTime } = req.body;

    if (typeof availabilityId !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "availabilityId must be a string",
      });
    }

    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "startTime and endTime must be strings",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Invalid date format. Use ISO string",
      });
    }

    if (end <= start) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "endTime must be greater than startTime",
      });
    }

    const data = await AvailabilityService.updateAvailability(
      availabilityId,
      start,
      end
    );

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Availability 30-day package updated successfully",
      data,
    });
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await AvailabilityService.deleteAvailability(id as string);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Availability slot deleted successfully",
      data,
    });
  }),
};
