import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(new ApiError(401, "UNAUTHORIZED", "Authentication is required."));
    return;
  }

  // TODO: verify JWT and attach user context to req.
  next();
};
