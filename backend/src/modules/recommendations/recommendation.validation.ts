import { z } from "zod";

export const personalRecommendationSchema = z.object({
  meetingPurposeId: z.number().optional(),
  excludeRecentDays: z.number().optional(),
  limit: z.number().optional(),
  includeNewMenu: z.boolean().optional()
});
