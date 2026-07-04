import { Router } from "express";
import { login, logout, signup } from "./auth.controller.js";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { loginSchema, signupSchema } from "./auth.validation.js";

export const authRouter = Router();

// Supabase Auth 회원가입
authRouter.post("/signup", validateBody(signupSchema), signup);

// Supabase Auth 로그인
authRouter.post("/login", validateBody(loginSchema), login);

// JWT 기반 서비스에서는 서버 세션을 지우기보다 클라이언트 토큰 삭제가 중심이다.
// 그래도 API 명세를 맞추기 위해 보호 라우트로 둔다.
authRouter.post("/logout", authMiddleware, logout);