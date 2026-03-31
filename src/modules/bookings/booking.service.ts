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
      const isPackage = slot.type === "PACKAGE_30D";
      const slotPackagePrice = tutorProfile.hourlyRate * slotDurationHours * (isPackage ? 30 : 1);
      
      const dynamicNotes = isPackage
        ? `30-Day Contract: Standard fixed recurring schedule from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()} matching exactly 30 days.`
        : `Single Session: One-time private session on ${start.toLocaleDateString()} from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()}.`;

      const newBooking = await tx.booking.create({
        data: {
          studentId,
          tutorId,
          tutorProfileId,
          availabilityId,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          price: slotPackagePrice,
          status: "PENDING",
          notes: dynamicNotes
        },
      });

      await tx.notification.create({
        data: {
          userId: tutorId,
          title: "New Booking Received",
          message: `A student booked a ${isPackage ? '30-day package' : 'single session'} with your availability slot.`,
          type: "BOOKING",
        },
      });

      // Notify student about booking creation + payment reminder
      await tx.notification.create({
        data: {
          userId: studentId,
          title: "Booking Created – Payment Required",
          message: `Your booking has been created! Please complete payment to confirm your session.`,
          type: "PAYMENT",
        },
      });

      return newBooking;
    }

    // Processing manual slot creation (no pre-generated availability picked)
    const manualBooking = await tx.booking.create({
      data: {
        studentId,
        tutorId,
        tutorProfileId,
        scheduledStart: start,
        scheduledEnd: end,
        price: thirtyDaysPrice,
        status: "PENDING",
        notes: thirtyDaysNotes
      },
    });

    await tx.notification.create({
      data: {
        userId: tutorId,
        title: "New Booking Received",
        message: `A student booked a 30-day package with custom scheduling.`,
        type: "BOOKING",
      },
    });

    // Notify student about booking creation + payment reminder
    await tx.notification.create({
      data: {
        userId: studentId,
        title: "Booking Created – Payment Required",
        message: `Your booking has been created! Please complete payment to confirm your session.`,
        type: "PAYMENT",
      },
    });

    return manualBooking;
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

    // A student cannot cancel a booking once payment is successfully closed out
    if (role === "STUDENT" && booking.paymentStatus === "PAID") {
      throw new AppError(status.BAD_REQUEST, "Cannot cancel a session that has already been paid and fully confirmed.");
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
    const cancelledBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledById: userId,
        cancelReason: reason ?? null,
      },
    });

    const targetUserId = userId === booking.studentId ? booking.tutorId : booking.studentId;
    
    await tx.notification.create({
      data: {
        userId: targetUserId,
        title: "Booking Cancelled",
        message: `An upcoming reserved booking block was cancelled securely.`,
        type: "BOOKING"
      }
    });

    return cancelledBooking;
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

  const completed = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" },
  });

  await prisma.notification.create({
    data: {
      userId: booking.studentId,
      title: "Booking Finalized",
      message: "Your session block has fully concluded! Please leave a review for this tutor.",
      type: "BOOKING"
    }
  });

  return completed;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getBooking,
  cancelBooking,
  completeBooking
};