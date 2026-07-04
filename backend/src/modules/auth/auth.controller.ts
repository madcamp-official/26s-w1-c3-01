import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { authService } from "./auth.service.js";

// 회원가입 요청 처리
export const signup: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.signup(req.body);
    sendSuccess(res, data, 201, "회원가입이 완료되었습니다.");
  } catch (error) {
    next(error);
  }
};

// 로그인 요청 처리
export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// 로그아웃 요청 처리
// Supabase access token은 stateless라 서버에서 강제 폐기하기보다
// 프론트에서 localStorage/sessionStorage의 token을 제거하는 방식이 기본이다.
export const logout: RequestHandler = (_req, res) => {
  sendSuccess(res, { loggedOut: true });
};