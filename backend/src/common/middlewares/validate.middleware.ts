import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ERROR_CODES } from "../constants/errorCodes.js";

export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "요청 값이 올바르지 않습니다.",
          details: result.error.flatten()
        }
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
