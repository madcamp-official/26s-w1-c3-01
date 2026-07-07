import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { authService } from "./auth.service.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { ERROR_CODES } from "../../common/constants/errorCodes.js";
import { invalidateAuthCache, invalidateProfileCache } from "../../common/middlewares/auth.middleware.js";

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

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const syncProfile: RequestHandler = async (req, res, next) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: "로그인이 필요합니다.",
        details: {}
      }
    });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      throw Object.assign(new Error("유효하지 않은 토큰입니다."), {
        status: 401,
        code: ERROR_CODES.UNAUTHORIZED
      });
    }

    const user = await authService.syncProfile(data.user);
    invalidateProfileCache(data.user.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const checkNickname: RequestHandler = async (req, res, next) => {
  try {
    const nickname = typeof req.query.nickname === "string" ? req.query.nickname : "";
    sendSuccess(res, await authService.checkNickname(nickname));
  } catch (error) {
    next(error);
  }
};

export const guestSignup: RequestHandler = async (_req, res, next) => {
  try {
    const data = await authService.signupGuest();
    sendSuccess(res, data, 201, "게스트 계정이 생성되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const token = req.auth!.accessToken;
    const data = await authService.logout(req.auth!);
    invalidateAuthCache(token);
    invalidateProfileCache(req.auth!.profile.authUserId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
