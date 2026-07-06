import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import { createPersonalRecommendation, getPersonalRecommendation } from "./recommendation.controller.js";
import { personalRecommendationSchema } from "./recommendation.validation.js";

export const recommendationRouter = Router();

recommendationRouter.get(
  "/personal",
  authMiddleware,
  getPersonalRecommendation
);

recommendationRouter.post(
  "/personal",
  authMiddleware,
  validateBody(personalRecommendationSchema),
  createPersonalRecommendation
);
