import { prisma } from "../../lib/prisma";

type CreateReviewPayload = {
  bookingId: string;
  rating: number;
  comment?: string;
};

const createReview = async (
  studentId: string,
  payload: CreateReviewPayload,
) => {
  const { bookingId, rating, comment } = payload;

  // booking must exist
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new Error("Booking not found");

  // only booking student can review
  if (booking.studentId !== studentId) throw new Error("Not allowed");

  // only after completed
  if (booking.status !== "COMPLETED") {
    throw new Error("You can review only after booking is COMPLETED");
  }

  // create review
  const review = await prisma.review.create({
    data: {
      bookingId,
      studentId,
      tutorId: booking.tutorId,
      rating,
      comment: comment ?? null,
    },
  });

  // update tutorProfile rating summary
  const stats = await prisma.review.aggregate({
    where: { tutorId: booking.tutorId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.tutorProfile.update({
    where: { userId: booking.tutorId },
    data: {
      avgRating: Number(stats._avg.rating ?? 0),
      totalReviews: stats._count.rating,
    },
  });

  return review;
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
