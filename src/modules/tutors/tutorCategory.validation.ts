import { z } from "zod";

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  searchTerm: z.string().optional(),
});

export const listTutorCategoriesValidation = z.object({
  params: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
  }),
  query: listQuery,
});

export const createTutorCategoryValidation = z.object({
  body: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
    categoryId: z.string().min(1, "categoryId is required"),
  }),
});

export const updateTutorCategoryValidation = z.object({
  params: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
    categoryId: z.string().min(1, "categoryId is required"),
  }),
  body: z.object({
    name: z.string().min(1, "Name is required").max(120),
  }),
});

export const deleteTutorCategoryValidation = z.object({
  params: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
    categoryId: z.string().min(1, "categoryId is required"),
  }),
});
