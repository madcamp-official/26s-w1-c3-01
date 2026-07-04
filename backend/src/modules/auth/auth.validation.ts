import { z } from "zod";
import { USER_TYPES } from "../../common/constants/status.js";

// 회원가입 요청 body 검증
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().min(1),
  userType: z.enum(USER_TYPES).optional()
});

// 로그인 요청 body 검증
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});