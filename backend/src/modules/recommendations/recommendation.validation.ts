import { z } from "zod";

export const personalRecommendationSchema = z.object({
  meetingPurposeId: z.coerce.number().int().positive().optional(),
  excludeRecentDays: z.coerce.number().int().min(0).max(365).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  includeNewMenu: z.boolean().optional()
});