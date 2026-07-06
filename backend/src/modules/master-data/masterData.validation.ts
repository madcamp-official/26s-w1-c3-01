import { z } from "zod";

const purposeSuitabilitySchema = z.object({
  meetingPurposeId: z.coerce.number().int().positive(),
  suitabilityScore: z.coerce.number().min(0).max(5)
});

export const createMenuSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  spicyLevel: z.coerce.number().int().min(0).max(5),
  priceLevel: z.coerce.number().int().min(1).max(5).nullable().optional(),
  calorie: z.coerce.number().int().min(0).nullable().optional(),
  tagIds: z.array(z.coerce.number().int().positive()).optional(),
  allergyIds: z.array(z.coerce.number().int().positive()).optional(),
  purposeSuitability: z.array(purposeSuitabilitySchema).optional()
});

export const updateMenuSchema = createMenuSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "수정할 값을 최소 1개 이상 입력해야 합니다."
});
