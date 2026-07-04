import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(500, "INTERNAL_SERVER_ERROR", "Internal server error.");

  res.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details
    }
  });
};
