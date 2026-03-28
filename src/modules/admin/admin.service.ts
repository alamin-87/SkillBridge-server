import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// Note: Removed getDashboardStats since we implemented StatsModule comprehensively.

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
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

  return prisma.user.update({
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

    return tx.booking.delete({
      where: { id },
    });
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

export const AdminService = {
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  getAllBookings,
  deleteBooking,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
