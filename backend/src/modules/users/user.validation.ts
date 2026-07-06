import { z } from "zod";
import { USER_TYPES } from "../../common/constants/status.js";

// 내 프로필 수정 요청 body 검증
export const updateUserSchema = z.object({
  nickname: z.string().trim().min(1).max(30).optional(),
  userType: z.enum(USER_TYPES).optional()
});
