import { z } from "zod";

export const personalRecommendationSchema = z.object({
  recentDuplicateDays: z.number().int().min(0).max(30).optional(),
  excludeRecentDays: z.number().int().min(0).max(30).optional(),
  limit: z.number().int().min(1).max(10).optional(),
  includeNewMenu: z.boolean().optional()
});
