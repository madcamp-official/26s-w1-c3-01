import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
};
