import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    /** URL-based image update */
    image: z.string().url().nullable().optional(),
    /** Legacy fields kept for compatibility */
    contactNumber: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
  }),
});