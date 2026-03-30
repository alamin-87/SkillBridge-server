import { prisma } from "../../lib/prisma";
import type { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";

export type TutorListQuery = {
  search?: string;
  searchTerm?: string;
  categoryId?: string;
  minRating?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
};

const getAllTutors = async (query: TutorListQuery) => {
  const searchTerm = query.search ?? query.searchTerm;
  const trimmedSearch = typeof searchTerm === "string" ? searchTerm.trim() : "";

  const queryParams: IQueryParams = {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    sortBy: query.sortBy ?? "-avgRating,hourlyRate",
    ...(trimmedSearch ? { searchTerm: trimmedSearch } : {}),
  };

  const qb = new QueryBuilder(prisma.tutorProfile, queryParams, {
    applySoftDeleteDefault: false,
    searchableFields: ["bio", "user.name", "categories.category.name"],
  });

  qb.search()
    .where({ user: { role: "TUTOR", status: "ACTIVE" } });

  if (query.minRating !== undefined) {
    qb.where({ avgRating: { gte: query.minRating } });
  }
  if (query.maxPrice !== undefined) {
    qb.where({ hourlyRate: { lte: query.maxPrice } });
  }
  if (query.categoryId) {
    qb.where({ categories: { some: { categoryId: query.categoryId } } });
  }

  qb.include({
    user: { select: { id: true, name: true, image: true } },
    categories: { include: { category: true } },
    availability: true,
  })
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

const getTutorById = async (id: string) => {
  const qb = new QueryBuilder(
    prisma.tutorProfile,
    {},
    { applySoftDeleteDefault: false },
  );

  qb.where({ id }).include({
    user: { select: { id: true, name: true, email: true, image: true } },
    categories: { include: { category: true } },
    availability: {
      where: { isBooked: false },
      orderBy: { startTime: "asc" },
    },
  });

  return qb.findFirst();
};

const getMyTutorProfile = async (userId: string) => {
  const qb = new QueryBuilder(
    prisma.tutorProfile,
    {},
    { applySoftDeleteDefault: false },
  );

  qb.where({ userId }).include({
    user: {
      select: { id: true, name: true, email: true, image: true, role: true },
    },
    categories: { include: { category: true } },
    availability: true,
  });

  const result = await qb.findFirst();

  if (!result) {
    const err: Error & { code?: string } = new Error("Tutor profile not found");
    err.code = "P2025";
    throw err;
  }
  return result;
};

export const TutorsService = {
  getTutorById,
  getAllTutors,
  getMyTutorProfile,
};
