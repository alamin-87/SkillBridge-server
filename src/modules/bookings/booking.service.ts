import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

type CreateBookingPayload = {
  tutorProfileId: string;
  tutorId: string;
  availabilityId?: string;
  scheduledStart: string;
  scheduledEnd: string;
};

const createBooking = async (studentId: string, payload: CreateBookingPayload) => {
  const { tutorProfileId, tutorId, availabilityId, scheduledStart, scheduledEnd } = payload;

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(status.BAD_REQUEST, "Invalid date format for scheduledStart/scheduledEnd");
  }
  if (end <= start) {
    throw new AppError(status.BAD_REQUEST, "scheduledEnd must be after scheduledStart");
  }

  // Calculate 30-day duration price
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
  });
  
  if (!tutorProfile) {
    throw new AppError(status.NOT_FOUND, "Tutor profile not found");
  }

  // Duration in hours (for exactly one session)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Calculate price for 30 consecutive days (Base rate * Duration * 30 days)
  const thirtyDaysPrice = tutorProfile.hourlyRate * durationHours * 30;

  // Add notes implicitly enforcing frontend & backend 30 days display validity.
  const thirtyDaysNotes = `30-Day Contract: Standard fixed recurring schedule from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()} matching exactly 30 days total calculated.`;

  // Process Booking with optional slot locking 
  return prisma.$transaction(async (tx) => {
    if (availabilityId) {
      const slot = await tx.tutorAvailability.findUnique({ where: { id: availabilityId } });
      if (!slot) throw new AppError(status.NOT_FOUND, "Availability record not found");
      if (slot.isBooked) throw new AppError(status.CONFLICT, "This availability slot is already fully booked");

      // Ensure slot matches expected tutor profile
      if (slot.tutorProfileId !== tutorProfileId) {
        throw new AppError(status.FORBIDDEN, "Availability identifier does not logically match the provided tutor profile");
      }

      // Lock availability for subsequent attempts
      await tx.tutorAvailability.update({
        where: { id: availabilityId },
        data: { isBooked: true },
      });

      const slotDurationHours = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60 * 60);
      const slotPackagePrice = tutorProfile.hourlyRate * slotDurationHours * 30; 

      return tx.booking.create({
        data: {
          studentId,
          tutorId,
          tutorProfileId,
          availabilityId,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          price: slotPackagePrice,
          status: "CONFIRMED",
          notes: thirtyDaysNotes
        },
      });
    }

    // Processing manual slot creation (no pre-generated availability picked)
    return tx.booking.create({
      data: {
        studentId,
        tutorId,
        tutorProfileId,
        scheduledStart: start,
        scheduledEnd: end,
        price: thirtyDaysPrice,
        status: "CONFIRMED",
        notes: thirtyDaysNotes
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

  // Default STUDENT fetch
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

  if (!booking) throw new AppError(status.NOT_FOUND, "Booking could not be found");

  // Validate accessibility restrictions dynamically
  if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
    throw new AppError(status.FORBIDDEN, "Not allowed to view this booking structure");
  }

  return booking;
};

const cancelBooking = async (
  bookingId: string,
  userId: string,
  role: "STUDENT" | "TUTOR" | "ADMIN",
  reason?: string
) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new AppError(status.NOT_FOUND, "Target booking could not be located");

    // Control cancellation access
    if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
      throw new AppError(status.FORBIDDEN, "Not allowed to alter this booking state");
    }

    // If cancellation processed prior, ignore repetitious updates
    if (booking.status === "CANCELLED") return booking;

    // Reactivate standard accessibility loop
    if (booking.availabilityId) {
      await tx.tutorAvailability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false },
      });
    }

    // Process ultimate cancellation status application
    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledById: userId,
        cancelReason: reason ?? null,
      },
    });
  });
};

const completeBooking = async (bookingId: string, tutorId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) throw new AppError(status.NOT_FOUND, "Booking data not found or removed");

  if (booking.tutorId !== tutorId) {
    throw new AppError(status.FORBIDDEN, "Completion restricted strictly to standard assigned tutor");
  }

  if (booking.status !== "CONFIRMED") {
    throw new AppError(status.BAD_REQUEST, "Booking item requires CONFIRMED status before completion trigger applicable");
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" },
  });
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getBooking,
  cancelBooking,
  completeBooking
};