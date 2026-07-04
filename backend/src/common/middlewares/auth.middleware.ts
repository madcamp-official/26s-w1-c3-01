import type { RequestHandler } from "express";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authMiddleware: RequestHandler = (req, res, next) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: "로그인이 필요합니다.", details: {} }
    });
    return;
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: "유효하지 않은 토큰입니다.", details: {} }
    });
  }
};
