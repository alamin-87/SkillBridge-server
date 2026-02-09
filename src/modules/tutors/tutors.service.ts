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
const parseLanguages = (value: any): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const s = value.trim();

    // JSON string: '["English","Bangla"]'
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
          return arr
            .map(String)
            .map((x) => x.trim())
            .filter(Boolean);
        }
      } catch {
        // ignore -> fallback below
      }
    }

    // comma-separated fallback
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

const serializeTutorProfile = (profile: any) => {
  if (!profile) return profile;
  return {
    ...profile,
    languages: parseLanguages(profile.languages),
  };
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
  const result = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      categories: { include: { category: true } },
      availability: true,
    },
  });

  if (!result) {
    const err: any = new Error("Tutor profile not found");
    err.code = "P2025";
    throw err;
  }
  return result;
};
export const updateTutorProfile = async (userId: string, payload: any) => {
  const data: any = {};

  if (payload.bio !== undefined) data.bio = payload.bio;
  if (payload.hourlyRate !== undefined)
    data.hourlyRate = Number(payload.hourlyRate);
  if (payload.experienceYrs !== undefined)
    data.experienceYrs = Number(payload.experienceYrs);
  if (payload.location !== undefined) data.location = payload.location;
  if (payload.profileImage !== undefined)
    data.profileImage = payload.profileImage;

  // normalize payload languages into string[]
  const normalizeLanguages = (input: any): string[] => {
    let langs: string[] = [];

    if (Array.isArray(input)) {
      langs = input;
    } else if (typeof input === "string") {
      const str = input.trim();

      if (str.startsWith("[") && str.endsWith("]")) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) langs = parsed;
          else langs = [str];
        } catch {
          langs = str.split(",");
        }
      } else {
        langs = str.split(",");
      }
    }

    const seen = new Set<string>();
    return langs
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((x) => {
        const key = x.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  // store as JSON string in DB
  if (payload.languages !== undefined) {
    const clean = normalizeLanguages(payload.languages);
    data.languages = JSON.stringify(clean);
  }

  return prisma.$transaction(async (tx) => {
    // upsert tutor profile
    const tutorProfile = await tx.tutorProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    // update categories by NAME
    if (payload.categories !== undefined) {
      if (!Array.isArray(payload.categories)) {
        throw new Error("categories must be an array of strings");
      }

      const categoryNames = payload.categories
        .filter((c: any) => typeof c === "string")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);

      await tx.tutorCategory.deleteMany({
        where: { tutorProfileId: tutorProfile.id },
      });

      for (const name of categoryNames) {
        const category = await tx.category.upsert({
          where: { name },
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
    //  return updated profile (IMPORTANT: return languages as array)
    const profile = await tx.tutorProfile.findUnique({
      where: { id: tutorProfile.id },
      include: {
        categories: { include: { category: true } },
        user: true,
      },
    });

    return serializeTutorProfile(profile);
  });
};

export const TutorsService = {
  createTutor,
  getTutorById,
  getAllTutors,
  getMyTutorProfile,
  updateTutorProfile,
};
