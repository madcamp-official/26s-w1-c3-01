import { z } from "zod";

export const replacePreferenceSchema = z.object({
  menuPreferences: z.array(z.object({ menuId: z.number(), preferenceScore: z.number().min(-5).max(5) })).optional(),
  categoryPreferences: z.array(z.object({ categoryId: z.number(), preferenceScore: z.number().min(-5).max(5) })).optional(),
  tagPreferences: z.array(z.object({ tagId: z.number(), preferenceScore: z.number().min(-5).max(5) })).optional(),
  allergyIds: z.array(z.number()).optional()
});
