import { z } from "zod";

export const createMeetingRecommendationSchema = z.object({
  resultLimit: z.coerce.number().int().min(1).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
  recentDuplicateDays: z.coerce.number().int().min(0).max(365).optional(),
  excludeRecentDays: z.coerce.number().int().min(0).max(365).optional()
});

export const selectMeetingMenuSchema = z.object({
  menuId: z.coerce.number().int().positive()
});