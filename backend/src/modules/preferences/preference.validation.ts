import { z } from "zod";

// 선호도 점수는 DB 제약과 동일하게 0~5만 허용한다.
const preferenceScoreSchema = z.number().int().min(0).max(5);

export const replacePreferenceSchema = z.object({
  menuPreferences: z
    .array(
      z.object({
        menuId: z.number().int().positive(),
        preferenceScore: preferenceScoreSchema
      })
    )
    .optional()
    .default([]),

  categoryPreferences: z
    .array(
      z.object({
        categoryId: z.number().int().positive(),
        preferenceScore: preferenceScoreSchema
      })
    )
    .optional()
    .default([]),

  tagPreferences: z
    .array(
      z.object({
        tagId: z.number().int().positive(),
        preferenceScore: preferenceScoreSchema
      })
    )
    .optional()
    .default([]),

  allergyIds: z.array(z.number().int().positive()).optional().default([])
});
