import { z } from "zod";
import { USER_TYPES } from "../../common/constants/status.js";

// 회원가입 요청 body 검증
export const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  nickname: z.string().trim().min(1, "닉네임은 필수입니다.").max(30),
  userType: z.enum(USER_TYPES).optional()
});

// 로그인 요청 body 검증
export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "비밀번호는 필수입니다.")
});