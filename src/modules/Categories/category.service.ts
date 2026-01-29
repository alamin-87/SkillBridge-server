import { prisma } from "../../lib/prisma";

const createCategory = async (name: string) => {
  return prisma.category.create({
    data: { name },
  });
};

const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const CategoryService = { createCategory, getAllCategories };
