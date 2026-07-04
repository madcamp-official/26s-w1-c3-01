import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { createPersonalRecommendation } from "./recommendation.controller.js";

export const recommendationRouter = Router();

recommendationRouter.post("/personal", authMiddleware, createPersonalRecommendation);
