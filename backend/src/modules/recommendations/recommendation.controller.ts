import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { recommendationService } from "./recommendation.service.js";

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