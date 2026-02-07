import type {
  TutorCategory,
  TutorProfile,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type TutorListQuery = {
  search?: string | undefined;
  categoryId?: string | undefined;
  category?: string | undefined;
  minRating?: number | undefined;
  maxPrice?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
};
const getAllTutors = async (query: TutorListQuery) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: any = {
    user: { role: "TUTOR", status: "ACTIVE" },
    ...(query.search
      ? {
          OR: [
            { bio: { contains: query.search, mode: "insensitive" } },
            { user: { name: { contains: query.search, mode: "insensitive" } } },
            {
              categories: {
                some: {
                  category: {
                    name: { contains: query.search, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(query.minRating ? { avgRating: { gte: query.minRating } } : {}),
    ...(query.maxPrice ? { hourlyRate: { lte: query.maxPrice } } : {}),
    ...(query.categoryId
      ? { categories: { some: { categoryId: query.categoryId } } }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ avgRating: "desc" }, { hourlyRate: "asc" }],
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
        availability: true,
      },
    }),
  ]);

  return { meta: { page, limit, total }, data };
};

const getTutorById = (id: string) => {
  return prisma.tutorProfile.findUnique({
    where: { id: id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      categories: { include: { category: true } },
      availability: {
        where: { isBooked: false },
        orderBy: { startTime: "asc" },
      },
    },
  });
};
const createTutor = async (
  data: Omit<TutorProfile, "id" | "createdAt" | "updatedAt" | "authorId">,
  userId: string,
) => {
  const result = await prisma.tutorProfile.create({
    data: {
      ...data,
      userId: userId,
    },
  });

  return result;
};
const getMyTutorProfile = async (userId: string) => {
  // If userId is not actually unique in schema, use findFirst instead.
  const result = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, role: true } },
      categories: { include: { category: true } },
      availability: true,
    },
  });

  if (!result) {
    // mimic findUniqueOrThrow behavior explicitly
    const err: any = new Error("Tutor profile not found");
    err.code = "P2025";
    throw err;
  }

  return result;
};
// export const updateTutorProfile = async (userId: string, payload: any) => {
//   const data: any = {};

//   if (payload.bio !== undefined) data.bio = payload.bio;
//   if (payload.hourlyRate !== undefined)
//     data.hourlyRate = Number(payload.hourlyRate);
//   if (payload.experienceYrs !== undefined)
//     data.experienceYrs = Number(payload.experienceYrs);
//   if (payload.location !== undefined) data.location = payload.location;
//   if (payload.languages !== undefined) {
//     data.languages = Array.isArray(payload.languages)
//       ? JSON.stringify(payload.languages)
//       : payload.languages;
//   }
//   if (payload.profileImage !== undefined)
//     data.profileImage = payload.profileImage;

//   return prisma.tutorProfile.upsert({
//     where: { userId }, // userId is @unique ✅
//     update: data,
//     create: {
//       userId,
//       ...data,
//     },
//   });
// };
export const updateTutorProfile = async (userId: string, payload: any) => {
  const data: any = {};

  if (payload.bio !== undefined) data.bio = payload.bio;
  if (payload.hourlyRate !== undefined)
    data.hourlyRate = Number(payload.hourlyRate);
  if (payload.experienceYrs !== undefined)
    data.experienceYrs = Number(payload.experienceYrs);
  if (payload.location !== undefined) data.location = payload.location;
  if (payload.languages !== undefined) {
    data.languages = Array.isArray(payload.languages)
      ? JSON.stringify(payload.languages)
      : payload.languages;
  }
  if (payload.profileImage !== undefined)
    data.profileImage = payload.profileImage;

  return prisma.$transaction(async (tx) => {
    // 1️⃣ upsert tutor profile (UNCHANGED behavior)
    const tutorProfile = await tx.tutorProfile.upsert({
      where: { userId }, // userId is @unique ✅
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    // 2️⃣ OPTIONAL: update categories by NAME
    if (payload.categories !== undefined) {
      if (!Array.isArray(payload.categories)) {
        throw new Error("categories must be an array of strings");
      }

      const categoryNames = payload.categories
        .filter((c: any) => typeof c === "string")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);

      // delete old category links
      await tx.tutorCategory.deleteMany({
        where: { tutorProfileId: tutorProfile.id },
      });

      // recreate categories + links
      for (const name of categoryNames) {
        const category = await tx.category.upsert({
          where: { name }, // name is unique ✅
          update: {},
          create: { name },
        });

        await tx.tutorCategory.create({
          data: {
            tutorProfileId: tutorProfile.id,
            categoryId: category.id,
          },
        });
      }
    }

    // 3️⃣ return updated profile with categories
    return tx.tutorProfile.findUnique({
      where: { id: tutorProfile.id },
      include: {
        categories: { include: { category: true } },
      },
    });
  });
};
export const TutorsService = {
  createTutor,
  getTutorById,
  getAllTutors,
  getMyTutorProfile,
  updateTutorProfile,
};
