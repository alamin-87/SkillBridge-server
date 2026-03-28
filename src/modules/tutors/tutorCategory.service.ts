import type { IQueryParams } from "../../interfaces/query.interface";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";

export type TutorCategoryListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  searchTerm?: string;
};

const assertTutorProfileOwnedByUser = async (
  tutorProfileId: string,
  userId: string,
) => {
  const profile = await prisma.tutorProfile.findFirst({
    where: { id: tutorProfileId, userId },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError(403, "You can only manage categories on your own tutor profile");
  }
};

const assertTutorCategoryLinkExists = async (
  tutorProfileId: string,
  categoryId: string,
) => {
  const link = await prisma.tutorCategory.findUnique({
    where: {
      tutorProfileId_categoryId: { tutorProfileId, categoryId },
    },
    select: { id: true },
  });
  if (!link) {
    throw new AppError(404, "This category is not linked to this tutor profile");
  }
};

const getAllTutorCategories = async (
  tutorProfileId: string,
  query: TutorCategoryListQuery = {},
) => {
  const queryParams: IQueryParams = {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    sortBy: query.sortBy ?? "category.name",
    ...(query.searchTerm !== undefined && query.searchTerm !== ""
      ? { searchTerm: query.searchTerm }
      : {}),
  };

  const qb = new QueryBuilder(prisma.tutorCategory, queryParams, {
    applySoftDeleteDefault: false,
    searchableFields: ["category.name"],
  });

  qb.where({ tutorProfileId })
    .search()
    .include({ category: true })
    .paginate()
    .sort();

  const result = await qb.execute();

  return {
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    },
    data: result.data,
  };
};

const createTutorCategory = async (
  tutorProfileId: string,
  categoryId: string,
  userId: string,
) => {
  await assertTutorProfileOwnedByUser(tutorProfileId, userId);

  try {
    return await prisma.tutorCategory.create({
      data: { tutorProfileId, categoryId },
      include: { category: true },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      throw new AppError(409, "This category is already assigned to this tutor profile");
    }
    throw e;
  }
};

/** Renames the global Category record (must be linked to this tutor profile). */
const updateCategoryNameForTutor = async (
  tutorProfileId: string,
  categoryId: string,
  name: string,
  userId: string,
) => {
  await assertTutorProfileOwnedByUser(tutorProfileId, userId);
  await assertTutorCategoryLinkExists(tutorProfileId, categoryId);

  return prisma.category.update({
    where: { id: categoryId },
    data: { name: name.trim() },
  });
};

const deleteTutorCategory = async (
  tutorProfileId: string,
  categoryId: string,
  userId: string,
) => {
  await assertTutorProfileOwnedByUser(tutorProfileId, userId);

  try {
    return await prisma.tutorCategory.delete({
      where: {
        tutorProfileId_categoryId: { tutorProfileId, categoryId },
      },
      include: { category: true },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") {
      throw new AppError(404, "Tutor category link not found");
    }
    throw e;
  }
};

export const TutorCategoryService = {
  createTutorCategory,
  getAllTutorCategories,
  updateCategoryNameForTutor,
  deleteTutorCategory,
};
