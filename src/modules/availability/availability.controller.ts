import type { Request, Response } from "express";
import { AvailabilityService } from "./availability.service";

export const AvailabilityController = {
  create: async (req: Request, res: Response) => {
    try {
      const { tutorProfileId, slots } = req.body;
      if (typeof tutorProfileId !== "string") {
        return res.status(400).json({
          success: false,
          message: "tutorProfileId must be a string",
        });
      }

      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "slots must be a non-empty array",
        });
      }

      for (const slot of slots) {
        if (
          typeof slot.startTime !== "string" ||
          typeof slot.endTime !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message: "Each slot must contain startTime and endTime as strings",
          });
        }

        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid date format. Use ISO string (e.g. 2026-04-09T23:49:00Z)",
          });
        }

        if (end <= start) {
          return res.status(400).json({
            success: false,
            message: "endTime must be greater than startTime",
          });
        }
      }

      const data = await AvailabilityService.createAvailability(
        tutorProfileId,
        slots,
      );

      return res.status(201).json({
        success: true,
        message: "Availability created successfully",
        data,
      });
    } catch (error: any) {
      console.error("Error creating availability:", error);
      return res.status(400).json({
        success: false,
        message: error?.message || "Create failed. Check time and try again",
      });
    }
  },

  getAll: async (req: Request, res: Response) => {
    const { tutorProfileId } = req.params;

    if (typeof tutorProfileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId must be a string",
      });
    }

    const data = await AvailabilityService.getAllAvailability(tutorProfileId);

    return res.status(200).json({
      success: true,
      data,
    });
  },
   update: async (req: Request, res: Response) => {
    const availabilityId = req.params.id;
    const { startTime, endTime } = req.body;

    if (typeof availabilityId !== "string") {
      return res.status(400).json({
        success: false,
        message: "availabilityId must be a string",
      });
    }

    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return res.status(400).json({
        success: false,
        message: "startTime and endTime must be strings",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use ISO string",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "endTime must be greater than startTime",
      });
    }

    const data = await AvailabilityService.updateAvailability(
      availabilityId,
      start,
      end
    );

    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data,
    });
  },
  
  remove: async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await AvailabilityService.deleteAvailability(id as string);

    return res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
      data,
    });
  },
};
