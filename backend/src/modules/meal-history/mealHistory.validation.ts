import { z } from "zod";

export const createMealHistorySchema = z.object({
  menuId: z.coerce.number().int().positive(),
  // Supabase timestamptz에 저장할 ISO 날짜 문자열입니다.
  eatenAt: z.string().datetime({ offset: true }).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  memo: z.string().trim().max(500).optional()
});

export const updateMealHistorySchema = createMealHistorySchema
  .partial()
  // PATCH 요청에서 빈 객체가 들어오는 것을 막습니다.
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 값을 최소 1개 이상 입력해야 합니다."
  });