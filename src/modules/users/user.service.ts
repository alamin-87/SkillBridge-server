import { prisma } from "../../lib/prisma";

const getUser = (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, status: true, image: true, phone: true },
  });
};

const updateUser = (userId: string, payload: { name?: string; image?: string | null; phone?: string | null }) => {
  return prisma.user.update({
    where: { id: userId },
    data: payload,
    select: { id: true, name: true, email: true, role: true, status: true, image: true, phone: true, updatedAt: true },
  });
};

export const UserService = { getUser, updateUser };
