import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { authService } from "./auth.service.js";

export const signup: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.signup(req.body);
    sendSuccess(res, data, 201, "회원가입이 완료되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_req, res) => {
  sendSuccess(res, { loggedOut: true });
};
