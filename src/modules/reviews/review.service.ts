import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

type CreateReviewPayload = {
  bookingId: string;
  rating: number;
  comment?: string;
};

const createReview = async (studentId: string, payload: CreateReviewPayload) => {
  const { bookingId, rating, comment } = payload;

  // booking must exist
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // only booking student can review
  if (booking.studentId !== studentId) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not authorized to review this booking"
    );
  }

  // only after completed
  if (booking.status !== "COMPLETED") {
    throw new AppError(
      status.BAD_REQUEST,
      "You can review only after the consultation booking is COMPLETED"
    );
  }

  // check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { bookingId },
  });
  if (existingReview) {
    throw new AppError(
      status.BAD_REQUEST,
      "Review already submitted for this booking"
    );
  }

  // create review and update tutor profile in a transaction
  return await prisma.$transaction(async (tx) => {
    // create review
    const review = await tx.review.create({
      data: {
        bookingId,
        studentId,
        tutorId: booking.tutorId,
        rating,
        comment: comment ?? null,
      },
      include: {
        tutor: { select: { id: true, name: true, image: true } },
      },
    });

    // update tutorProfile rating summary
    const stats = await tx.review.aggregate({
      where: { tutorId: booking.tutorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.tutorProfile.update({
      where: { userId: booking.tutorId },
      data: {
        avgRating: Number(stats._avg.rating ?? 0),
        totalReviews: stats._count.rating,
      },
    });

    await tx.notification.create({
      data: {
        userId: booking.tutorId,
        title: "New Student Review",
        message: `A student has provided a new review dropping ${rating} stars.`,
        type: "SYSTEM",
      },
    });

    return review;
  });
};

const getTutorReviews = async (tutorId: string) => {
  return prisma.review.findMany({
    where: { tutorId },
    include: {
      student: { select: { id: true, name: true, image: true } },
      booking: {
        select: { id: true, scheduledStart: true, scheduledEnd: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getMyReviews = async (studentId: string) => {
  return prisma.review.findMany({
    where: { studentId },
    include: {
      tutor: { select: { id: true, name: true, image: true } },
      booking: {
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const ReviewService = {
  createReview,
  getTutorReviews,
  getMyReviews,
};
