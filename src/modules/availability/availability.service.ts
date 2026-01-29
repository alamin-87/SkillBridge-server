import { prisma } from "../../lib/prisma";

type SlotInput = {
  startTime: string;
  endTime: string;
};

const createAvailability = async (
  tutorProfileId: string,
  slots: SlotInput[],
) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { id: true },
  });

  if (!profile) throw new Error("Tutor profile not found");

  const data = slots.map((s) => ({
    tutorProfileId,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
  }));

  await prisma.tutorAvailability.createMany({ data });

  return prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" },
  });
};

const getAllAvailability = async (tutorProfileId: string) => {
  return prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" },
  });
};
const updateAvailability = async (
  availabilityId: string,
  startTime: Date,
  endTime: Date
) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId },
  });

  if (!slot) {
    throw new Error("Availability not found");
  }

  // ❌ prevent updating booked slots
  if (slot.isBooked) {
    throw new Error("Booked availability cannot be updated");
  }

  return prisma.tutorAvailability.update({
    where: { id: availabilityId },
    data: {
      startTime,
      endTime,
    },
  });
};

const deleteAvailability = async (availabilityId: string) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId },
  });

  if (!slot) throw new Error("Availability not found");
  if (slot.isBooked) throw new Error("Booked slot cannot be deleted");

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
