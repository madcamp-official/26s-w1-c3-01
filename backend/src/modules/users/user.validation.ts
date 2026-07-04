import { z } from "zod";

export const updateUserSchema = z.object({
  nickname: z.string().min(1).optional(),
  userType: z.string().optional()
});
