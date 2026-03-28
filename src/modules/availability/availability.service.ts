import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

type SlotInput = {
  startTime: string;
  endTime: string;
};

// Helper function to calculate and append 30-day price information
const augmentSlotWith30DayPricing = (slot: any, hourlyRate: number) => {
  const durationHours =
    (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60 * 60);
  const thirtyDaysPrice = hourlyRate * durationHours * 30;

  return {
    ...slot,
    durationHours,
    thirtyDaysPrice,
    packageType: "30-Day Contract",
    notes: `Available for a fixed daily time from ${slot.startTime.toLocaleTimeString()} to ${slot.endTime.toLocaleTimeString()} matching exactly 30 days total calculated.`,
  };
};

const createAvailability = async (
  tutorProfileId: string,
  slots: SlotInput[]
) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { id: true, hourlyRate: true },
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Tutor profile not found");
  }

  const data = slots.map((s) => ({
    tutorProfileId,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
  }));

  // Atomically recreate exact requested slots
  await prisma.tutorAvailability.createMany({ data });

  const createdSlots = await prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" },
  });

  // Return mapped 30-day package indicators inherently matching new platform behavior guidelines
  return createdSlots.map((slot) =>
    augmentSlotWith30DayPricing(slot, profile.hourlyRate)
  );
};

const getAllAvailability = async (tutorProfileId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { id: true, hourlyRate: true },
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Tutor profile not found");
  }

  const slots = await prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" },
  });

  return slots.map((slot) =>
    augmentSlotWith30DayPricing(slot, profile.hourlyRate)
  );
};

const updateAvailability = async (
  availabilityId: string,
  startTime: Date,
  endTime: Date
) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId },
    include: {
      tutorProfile: { select: { hourlyRate: true } },
    },
  });

  if (!slot) {
    throw new AppError(status.NOT_FOUND, "Availability not found");
  }
  
  if (slot.isBooked) {
    throw new AppError(
      status.CONFLICT,
      "Already booked availability slots cannot be updated"
    );
  }

  const updatedSlot = await prisma.tutorAvailability.update({
    where: { id: availabilityId },
    data: {
      startTime,
      endTime,
    },
  });

  return augmentSlotWith30DayPricing(updatedSlot, slot.tutorProfile.hourlyRate);
};

const deleteAvailability = async (availabilityId: string) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId },
  });

  if (!slot) throw new AppError(status.NOT_FOUND, "Availability not found");
  
  if (slot.isBooked) {
    throw new AppError(
      status.CONFLICT,
      "A booked 30-day package slot cannot be securely deleted"
    );
  }

  return prisma.tutorAvailability.delete({
    where: { id: availabilityId },
  });
};

export const AvailabilityService = {
  createAvailability,
  getAllAvailability,
  updateAvailability,
  deleteAvailability,
};
