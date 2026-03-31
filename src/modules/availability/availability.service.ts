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

  const isPackage = slot.type === "PACKAGE_30D";
  const factor = isPackage ? 30 : 1;
  const totalPrice = hourlyRate * durationHours * factor;

  return {
    ...slot,
    durationHours,
    totalPrice,
    packageType: isPackage ? "30-Day Private" : "Single Session",
    notes: isPackage
      ? `Fixed daily time from ${slot.startTime.toLocaleTimeString()} to ${slot.endTime.toLocaleTimeString()} for 30 consecutive days.`
      : `Single one-on-one session at the specified time.`,
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

  const data = slots.map((s: any) => ({
    tutorProfileId,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
    type: s.type || "SINGLE",
  }));

  // Atomically recreate exact requested slots
  await prisma.tutorAvailability.createMany({ data });

  const createdSlots = await prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" },
  });

  // 🔥 Notify tutor
  const tutor = await prisma.user.findFirst({
    where: { tutorProfile: { id: tutorProfileId } },
    select: { id: true },
  });

  if (tutor) {
    await prisma.notification.create({
      data: {
        userId: tutor.id,
        title: "Availability Synchronized",
        message: "Your teaching availability has been successfully updated and is now visible to students.",
        type: "SYSTEM",
      },
    }).catch(() => {});
  }

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
