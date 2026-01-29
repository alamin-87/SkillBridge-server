import { prisma } from "../../lib/prisma";

const createTutorCategory = async (
  tutorProfileId: string,
  categoryId: string
) => {
  return prisma.tutorCategory.create({
    data: {
      tutorProfileId,
      categoryId,
    },
  });
};

const getAllTutorCategories = async (tutorProfileId: string) => {
  return prisma.tutorCategory.findMany({
    where: { tutorProfileId },
    include: {
      category: true,
    },
  });
};
const deleteTutorCategory = async (tutorProfileId: string, categoryId: string) => {
  return prisma.tutorCategory.delete({
    where: {
      tutorProfileId_categoryId: { tutorProfileId, categoryId },
    },
  });
};
export const TutorCategoryService = {
  createTutorCategory,
  getAllTutorCategories,
  deleteTutorCategory
};
