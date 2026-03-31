import { z } from "zod";

// ─── Create Tutor (Admin only) ───────────────────────────────────────────────
export const createTutorValidation = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name is too short"),
    tutor: z.object({
      bio: z.string().min(10, "Bio must be at least 10 characters").max(500),
      hourlyRate: z.number().positive("Hourly rate must be positive"),
      experienceYrs: z.number().int().nonnegative("Experience years must be non-negative"),
      location: z.string().optional(),
      languages: z.string().optional(),
      profileImage: z.string().url("Invalid URL").optional(),
      institution: z.string().optional(),
      categories: z.array(z.string()).optional(),
    }),
  }),
});

// ─── Tutor Request (Logged-in user) ──────────────────────────────────────────
export const createTutorRequestValidation = z.object({
  body: z.object({
    bio: z.string().min(10, "Bio must be at least 10 characters").max(500),
    hourlyRate: z.number().positive("Hourly rate must be positive"),
    experienceYrs: z.number().int().nonnegative("Experience years must be non-negative"),
    location: z.string().optional(),
    languages: z.string().optional(),
    institution: z.string().optional(),
    categories: z.array(z.string()).optional(),
  }),
});

// ─── Update Tutor Profile ───────────────────────────────────────────────────────
export const updateTutorValidation = z.object({
  body: z.object({
    bio: z.string().optional(),
    hourlyRate: z.number().nonnegative().optional(),
    experienceYrs: z.number().int().nonnegative().optional(),
    location: z.string().optional(),
    languages: z.string().optional(),
    profileImage: z.string().nullable().optional(),
    institution: z.string().optional(),
    categories: z.array(z.string()).optional(),
  }),
});

// ─── Reject Tutor Request (Admin only) ───────────────────────────────────────
export const rejectTutorRequestValidation = z.object({
  body: z.object({
    rejectionReason: z.string().min(10, "Rejection reason must be at least 10 characters"),
  }),
});
