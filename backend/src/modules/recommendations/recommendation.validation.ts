import { z } from "zod";

const nullableBudgetSchema = z.union([
  z.coerce.number().int().min(1).max(5),
  z.null()
]).optional();

export const personalRecommendationSchema = z.object({
  meetingPurposeId: z.coerce.number().int().positive().optional(),
  excludeRecentDays: z.coerce.number().int().min(0).max(365).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  recentDuplicateDays: z.coerce.number().int().min(0).max(30).optional(),
  includeNewMenu: z.boolean().optional(),
  budgetMin: nullableBudgetSchema,
  budgetMax: nullableBudgetSchema
});

export const personalRecommendationQuerySchema = z.object({
  meetingPurposeId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional()
});
