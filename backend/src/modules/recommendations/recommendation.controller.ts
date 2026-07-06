import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { recommendationService } from "./recommendation.service.js";
import { personalRecommendationQuerySchema } from "./recommendation.validation.js";

export const createPersonalRecommendation: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;

    sendSuccess(
      res,
      await recommendationService.createPersonalRecommendation(userId, req.body)
    );
  } catch (error) {
    next(error);
  }
};

export const getPersonalRecommendation: RequestHandler = async (req, res, next) => {
  try {
    const parsed = personalRecommendationQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw Object.assign(new Error("요청 값이 올바르지 않습니다."), {
        status: 400,
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten()
      });
    }

    const userId = req.auth!.profile!.userId;

    sendSuccess(
      res,
      await recommendationService.createPersonalRecommendation(userId, parsed.data)
    );
  } catch (error) {
    next(error);
  }
};
