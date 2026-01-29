import { prisma } from "../../lib/prisma";

type CreateBookingPayload = {
  tutorProfileId: string;
  tutorId: string;
  availabilityId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  price: number;
};

const createBooking = async (studentId: string, payload: CreateBookingPayload) => {
  const { tutorProfileId, tutorId, availabilityId, scheduledStart, scheduledEnd, price } = payload;

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date format for scheduledStart/scheduledEnd");
  }
  if (end <= start) {
    throw new Error("scheduledEnd must be greater than scheduledStart");
  }

  // optional slot locking
  return prisma.$transaction(async (tx) => {
    if (availabilityId) {
      const slot = await tx.tutorAvailability.findUnique({ where: { id: availabilityId } });
      if (!slot) throw new Error("Availability not found");
      if (slot.isBooked) throw new Error("This availability slot is already booked");

      // Ensure slot belongs to same tutorProfile
      if (slot.tutorProfileId !== tutorProfileId) {
        throw new Error("Availability does not belong to this tutorProfile");
      }

      // lock slot
      await tx.tutorAvailability.update({
        where: { id: availabilityId },
        data: { isBooked: true },
      });

      // override times from slot (recommended to avoid mismatch)
      return tx.booking.create({
        data: {
          studentId,
          tutorId,
          tutorProfileId,
          availabilityId,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          price,
          status: "CONFIRMED",
        },
      });
    }

    // no availabilityId provided -> free booking by given times
    return tx.booking.create({
      data: {
        studentId,
        tutorId,
        tutorProfileId,
        scheduledStart: start,
        scheduledEnd: end,
        price,
        status: "CONFIRMED",
      },
    });
  });
};

const getAllBookings = async (userId: string, role: string | undefined) => {
  if (role === "ADMIN") {
    return prisma.booking.findMany({
      include: {
        tutor: { select: { id: true, name: true, email: true, image: true } },
        student: { select: { id: true, name: true, email: true, image: true } },
        tutorProfile: true,
        review: true,
      },
      orderBy: { scheduledStart: "desc" },
    });
  }

  if (role === "TUTOR") {
    return prisma.booking.findMany({
      where: { tutorId: userId },
      include: {
        tutor: { select: { id: true, name: true, email: true, image: true } },
        student: { select: { id: true, name: true, email: true, image: true } },
        tutorProfile: true,
        review: true,
      },
      orderBy: { scheduledStart: "desc" },
    });
  }

  // STUDENT
  return prisma.booking.findMany({
    where: { studentId: userId },
    include: {
      tutor: { select: { id: true, name: true, email: true, image: true } },
      student: { select: { id: true, name: true, email: true, image: true } },
      tutorProfile: true,
      review: true,
    },
    orderBy: { scheduledStart: "desc" },
  });
};

const getBooking = async (bookingId: string, userId: string, role: string | undefined) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: { select: { id: true, name: true, email: true, image: true } },
      student: { select: { id: true, name: true, email: true, image: true } },
      tutorProfile: true,
      availability: true,
      review: true,
    },
  });

  if (!booking) throw new Error("Booking not found");

  // access control
  if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
    throw new Error("Not allowed");
  }

  return booking;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getBooking,
};