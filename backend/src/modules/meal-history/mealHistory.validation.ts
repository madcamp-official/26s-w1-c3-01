import { z } from "zod";

export const createMealHistorySchema = z.object({
  menuId: z.number(),
  eatenAt: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  memo: z.string().optional()
});
