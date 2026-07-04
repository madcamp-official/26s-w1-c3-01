import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { recommendationService } from "./recommendation.service.js";

export const createPersonalRecommendation: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await recommendationService.createPersonalRecommendation(req.auth!.profile!.userId, req.body));
  } catch (error) {
    next(error);
  }
};
