import type { RequestHandler } from "express";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { userRepository } from "../../modules/users/user.repository.js";

export const authMiddleware: RequestHandler = async (req, res, next) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: "로그인이 필요합니다.", details: {} }
    });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      throw error ?? new Error("Missing Supabase user");
    }
    const profile = await userRepository.ensureProfile(data.user);
    req.auth = { accessToken: token, user: data.user, profile };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: "유효하지 않은 토큰입니다.", details: {} }
    });
  }
};
