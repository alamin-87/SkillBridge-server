import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// Note: Removed getDashboardStats since we implemented StatsModule comprehensively.

const getAllUsers = async (query?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = Math.max(1, query?.page ?? 1);
  const limit = Math.min(100, Math.max(1, query?.limit ?? 50));
  const skip = (page - 1) * limit;

  // Build dynamic where clause
  const where: Record<string, unknown> = {};

  if (query?.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query?.role && ["STUDENT", "TUTOR", "ADMIN"].includes(query.role)) {
    where.role = query.role;
  }

  if (query?.status && ["ACTIVE", "BANNED"].includes(query.status)) {
    where.status = query.status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            studentBookings: true,
            tutorBookings: true,
            reviewsGiven: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserDetails = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tutorProfile: true, // will be null if user is not a tutor
      studentBookings: {
        take: 5,
        orderBy: { scheduledStart: "desc" },
      },
      tutorBookings: {
        take: 5,
        orderBy: { scheduledStart: "desc" },
      },
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "Associated User not found");
  }

  return user;
};

const updateUser = async (
  id: string,
  payload: { status?: "ACTIVE" | "BANNED"; role?: "STUDENT" | "TUTOR" | "ADMIN" }
) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError(status.NOT_FOUND, "User targeted for update not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  if (payload.status) {
    await prisma.notification.create({
      data: {
        userId: id,
        title: "Account Status Update",
        message: `Your account status was updated by an administrator to: ${payload.status}`,
        type: "SYSTEM",
      },
    });
  }

  if (payload.role) {
    await prisma.notification.create({
      data: {
        userId: id,
        title: "Account Role Upgrade",
        message: `Your account role was inherently modified by an administrator to: ${payload.role}`,
        type: "SYSTEM",
      },
    });
  }

  return updatedUser;
};

const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError(status.NOT_FOUND, "Cannot locate user to definitively delete");
  }

  // Uses onDelete: Cascade recursively inherently via Prisma schema maps
  return prisma.user.delete({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
};

const getAllBookings = async () => {
  return prisma.booking.findMany({
    include: {
      tutor: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
      tutorProfile: true,
      review: true,
      availability: true,
    },
    orderBy: { scheduledStart: "desc" },
  });
};

const deleteBooking = async (id: string) => {
  const existingBooking = await prisma.booking.findUnique({ where: { id } });
  if (!existingBooking) {
    throw new AppError(status.NOT_FOUND, "Target 30-day package booking not located");
  }

  return prisma.$transaction(async (tx) => {
    // Release availability back dynamically if tied specifically manually
    if (existingBooking.availabilityId) {
      await tx.tutorAvailability.update({
        where: { id: existingBooking.availabilityId },
        data: { isBooked: false },
      });
    }

    const deleted = await tx.booking.delete({
      where: { id },
    });

    // Notify student & tutor
    const notifyData = [
      {
        userId: existingBooking.studentId,
        title: "Booking Removed by Admin",
        message: "An administrator has removed your booking. If this was unexpected, please contact support.",
        type: "SYSTEM" as const,
      },
      {
        userId: existingBooking.tutorId,
        title: "Booking Removed by Admin",
        message: "An administrator has removed a booking from your schedule.",
        type: "SYSTEM" as const,
      }
    ];

    await tx.notification.createMany({ data: notifyData });

    return deleted;
  });
};

const getAllCategories = async () => {
  return prisma.category.findMany({ orderBy: { createdAt: "desc" } });
};

const createCategory = async (name: string) => {
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) {
    throw new AppError(status.CONFLICT, "Category already rigorously defined in schema");
  }
  return prisma.category.create({ data: { name } });
};

const updateCategory = async (id: string, name: string) => {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError(status.NOT_FOUND, "Category not found natively internally");
  }

  return prisma.category.update({
    where: { id },
    data: { name },
  });
};

const deleteCategory = async (id: string) => {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError(status.NOT_FOUND, "Category removal aborted due to undefined identification");
  }

  return prisma.category.delete({ where: { id } });
};

// ─── Payment Auditing ───────────────────────────────────────────────
const getAllPayments = async () => {
  return prisma.payment.findMany({
    include: {
      booking: {
        include: {
          tutor: { select: { name: true, email: true } },
          student: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Review Moderation ──────────────────────────────────────────────
const getAllReviews = async () => {
  return prisma.review.findMany({
    include: {
      tutor: { select: { name: true, email: true } },
      student: { select: { name: true, email: true } },
      booking: { select: { scheduledStart: true, scheduledEnd: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const deleteReview = async (id: string) => {
  const existingReview = await prisma.review.findUnique({ where: { id } });
  if (!existingReview) {
    throw new AppError(status.NOT_FOUND, "Review inherently not found");
  }

  return prisma.$transaction(async (tx) => {
    // Delete the review
    const deleted = await tx.review.delete({ where: { id } });

    // Re-calculate the tutor rating natively explicitly avoiding floating metrics
    const stats = await tx.review.aggregate({
      where: { tutorId: existingReview.tutorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.tutorProfile.update({
      where: { userId: existingReview.tutorId },
      data: {
        avgRating: Number(stats._avg.rating ?? 0),
        totalReviews: stats._count.rating,
      },
    });

    await tx.notification.create({
      data: {
        userId: existingReview.tutorId,
        title: "Review Moderated",
        message: "A review on your profile was removed by an administrator following moderation.",
        type: "SYSTEM",
      },
    });

    return deleted;
  });
};

// ─── Assignment Management ───────────────────────────────────────────
const getAllAssignments = async () => {
  return prisma.assignment.findMany({
    include: {
      createdBy: { select: { name: true, email: true } },
      booking: {
        include: {
          student: { select: { name: true, email: true } },
        },
      },
      submissions: {
        select: { id: true, status: true, grade: true, studentId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const deleteAssignment = async (id: string) => {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) throw new AppError(status.NOT_FOUND, "Assignment not found");
  
  const result = await prisma.assignment.delete({ where: { id } });

  // If bound to a booking, notify the student
  if (assignment.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: assignment.bookingId } });
    if (booking) {
      await prisma.notification.create({
        data: {
          userId: booking.studentId,
          title: "Assignment Removed",
          message: `An assignment (${assignment.title}) has been removed by an administrator.`,
          type: "SYSTEM",
        }
      }).catch(() => {});
    }
  }

  return result;
};

// ─── Booking Status Update ──────────────────────────────────────────
const updateBookingStatus = async (
  id: string,
  newStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
) => {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id },
      data: { status: newStatus },
      include: {
        student: { select: { id: true, name: true, email: true } },
        tutor: { select: { id: true, name: true, email: true } },
      },
    });

    // Release availability if cancelled
    if (newStatus === "CANCELLED" && booking.availabilityId) {
      await tx.tutorAvailability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false },
      });
    }

    // Notify both student and tutor about the status change
    const notificationData = [
      {
        userId: booking.studentId,
        title: "Booking Status Updated",
        message: `Your booking status has been updated to ${newStatus} by an administrator.`,
        type: "SYSTEM" as const,
      },
      {
        userId: booking.tutorId,
        title: "Booking Status Updated",
        message: `A booking with your student has been updated to ${newStatus} by an administrator.`,
        type: "SYSTEM" as const,
      },
    ];

    await tx.notification.createMany({ data: notificationData });

    return updated;
  });
};

// ─── Notification Management ────────────────────────────────────────
const getAllNotifications = async () => {
  return prisma.notification.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const deleteNotification = async (id: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    throw new AppError(status.NOT_FOUND, "Notification not found");
  }

  return prisma.notification.delete({ where: { id } });
};

const sendBroadcastNotification = async (title: string, message: string) => {
  const allUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  const data = allUsers.map((u) => ({
    userId: u.id,
    title,
    message,
    type: "SYSTEM" as const,
  }));

  const result = await prisma.notification.createMany({ data });
  return { sentTo: result.count };
};

const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "Target user not found");
  }

  return prisma.notification.create({
    data: { userId, title, message, type: "SYSTEM" },
  });
};

export const AdminService = {
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  getAllBookings,
  deleteBooking,
  updateBookingStatus,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllPayments,
  getAllReviews,
  deleteReview,
  getAllAssignments,
  deleteAssignment,
  getAllNotifications,
  deleteNotification,
  sendBroadcastNotification,
  sendNotificationToUser,
};
