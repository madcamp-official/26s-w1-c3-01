import type { ErrorRequestHandler } from "express";
import { ERROR_CODES } from "../constants/errorCodes.js";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err.status === "number" ? err.status : 500;
  const code = err.code ?? ERROR_CODES.INTERNAL_SERVER_ERROR;
  const message = err.message ?? "서버 내부 오류가 발생했습니다.";

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: err.details ?? {}
    }
  });
};
