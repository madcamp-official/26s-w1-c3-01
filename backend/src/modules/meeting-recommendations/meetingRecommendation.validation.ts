import { z } from "zod";

export const createMeetingRecommendationSchema = z.object({
  resultLimit: z.coerce.number().int().min(1).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
  recentDuplicateDays: z.coerce.number().int().min(0).max(365).optional(),
  excludeRecentDays: z.coerce.number().int().min(0).max(365).optional(),
  // 프론트의 구성원 칩에서 선택된 참여자만 추천 계산에 반영합니다.
  participantUserIds: z.array(z.coerce.number().int().positive()).optional()
});

export const selectMeetingMenuSchema = z.object({
  menuId: z.coerce.number().int().positive()
});
