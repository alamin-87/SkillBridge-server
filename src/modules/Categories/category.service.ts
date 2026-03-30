import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { QueryBuilder } from "../../utils/QueryBuilder";

const createCategory = async (name: string) => {
  // Check if category already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name },
  });

  if (existingCategory) {
    throw new AppError(status.CONFLICT, "Category already exists");
  }

  return prisma.category.create({
    data: { name },
  });
};

const getAllCategories = async (query: Record<string, unknown>) => {
  const categoryQuery = new QueryBuilder(
    prisma.category as any,
    query,
    {
      searchableFields: ["name"],
      filterableFields: ["name"],
      applySoftDeleteDefault: false,
    }
  )
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      tutorLinks: true
    });

  const result = await categoryQuery.execute();
  
  // To keep payload small and compatible with existing front-end structure if needed,
  // we can map the _count manually if we want, or just return the data.
  // The frontend expects tutorCount. Let's map it.
  const mappedData = result.data.map((cat: any) => ({
    ...cat,
    _count: { tutorLinks: cat.tutorLinks?.length || 0 }
  }));

  return {
    meta: result.meta,
    data: mappedData
  };
};

const linkTutorCategories = async (userId: string, categoryIds: string[]) => {
  // Ensure the tutor profile exists
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutorProfile) {
    throw new AppError(
      status.NOT_FOUND,
      "Tutor profile not found. Please create one first."
    );
  }

  // Ensure all provided categories actually exist in db
  const existingCategories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
    select: { id: true },
  });

  if (existingCategories.length !== categoryIds.length) {
    throw new AppError(
      status.BAD_REQUEST,
      "One or more provided categories do not exist"
    );
  }

  // Run in a transaction: delete old mappings and create the new ones
  await prisma.$transaction(async (tx) => {
    // 1. Delete all existing linked categories for this tutor
    await tx.tutorCategory.deleteMany({
      where: { tutorProfileId: tutorProfile.id },
    });

    // 2. Insert new linkages
    if (categoryIds.length > 0) {
      const mappings = categoryIds.map((categoryId) => ({
        tutorProfileId: tutorProfile.id,
        categoryId,
      }));

      await tx.tutorCategory.createMany({
        data: mappings,
      });
    }
  });

  // Return the newly linked categories properly formatted
  const updatedTutorCategories = await prisma.tutorCategory.findMany({
    where: { tutorProfileId: tutorProfile.id },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return updatedTutorCategories.map((tc) => tc.category);
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  linkTutorCategories,
};
