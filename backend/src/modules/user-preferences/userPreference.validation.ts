import { z } from "zod";

const nullableBudgetSchema = z
  .union([z.coerce.number().int().min(0), z.null()])
  .optional()
  .transform((value) => value ?? null);

export const updateUserPreferenceSchema = z
  .object({
    budgetMin: nullableBudgetSchema,
    budgetMax: nullableBudgetSchema,
    budget_min: nullableBudgetSchema,
    budget_max: nullableBudgetSchema
  })
  .transform((value) => ({
    budgetMin: value.budgetMin ?? value.budget_min,
    budgetMax: value.budgetMax ?? value.budget_max
  }))
  .refine(
    (value) => value.budgetMin === null || value.budgetMax === null || value.budgetMin <= value.budgetMax,
    {
      message: "budgetMin은 budgetMax보다 클 수 없습니다."
    }
  );

export const replaceCategoryPreferencesByNameSchema = z.object({
  preferences: z.array(
    z
      .object({
        category: z.string().trim().min(1),
        preferenceScore: z.coerce.number().int().min(0).max(5).optional(),
        preference_score: z.coerce.number().int().min(0).max(5).optional()
      })
      .transform((value) => ({
        category: value.category,
        preferenceScore: value.preferenceScore ?? value.preference_score ?? 5
      }))
  )
});
