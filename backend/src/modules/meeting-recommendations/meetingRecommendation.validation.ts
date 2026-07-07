import { z } from "zod";

export const createMeetingRecommendationSchema = z.object({
  resultLimit: z.coerce.number().int().min(1).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
  participantUserIds: z.array(z.coerce.number().int().positive()).min(1).optional()
});

export const selectMeetingMenuSchema = z.object({
  menuId: z.coerce.number().int().positive()
});
