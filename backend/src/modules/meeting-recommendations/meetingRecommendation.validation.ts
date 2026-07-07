import { z } from "zod";

const nullableBudgetSchema = z.union([
  z.coerce.number().int().min(1).max(5),
  z.null()
]).optional();

export const createMeetingRecommendationSchema = z.object({
  resultLimit: z.coerce.number().int().min(1).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
  participantUserIds: z.array(z.coerce.number().int().positive()).min(1).optional(),
  budgetMin: nullableBudgetSchema,
  budgetMax: nullableBudgetSchema
});

export const selectMeetingMenuSchema = z.object({
  menuId: z.coerce.number().int().positive()
});
