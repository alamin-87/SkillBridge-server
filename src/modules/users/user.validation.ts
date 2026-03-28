import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().optional(),
  profilePhoto: z.string().optional(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
});