import { prisma } from "../../lib/prisma";

const getDashboardStats = async () => {
  const [totalUsers, totalTutors, totalStudents, totalBookings, totalCategories] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.booking.count(),
    prisma.category.count(),
  ]);

  const [confirmed, completed, cancelled] = await Promise.all([
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
  ]);

  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    totalCategories,
    bookingStatus: { confirmed, completed, cancelled },
  };
};

const getAllUsers = () =>
  prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

const updateUser = (id: string, payload: { status?: "ACTIVE" | "BANNED"; role?: "STUDENT" | "TUTOR" | "ADMIN" }) =>
  prisma.user.update({
    where: { id },
    data: payload,
    select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true },
  });

const getAllBookings = () =>
  prisma.booking.findMany({
    include: {
      tutor: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
      tutorProfile: true,
      review: true,
      availability: true,
    },
    orderBy: { scheduledStart: "desc" },
  });

const getAllCategories = () => prisma.category.findMany({ orderBy: { createdAt: "desc" } });
const createCategory = (name: string) => prisma.category.create({ data: { name } });
const updateCategory = (id: string, name: string) =>
  prisma.category.update({
    where: { id },
    data: { name },
  });
const deleteCategory = (id: string) => prisma.category.delete({ where: { id } });

export const AdminService = {
  getDashboardStats,
  getAllUsers,
  updateUser,
  getAllBookings,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
