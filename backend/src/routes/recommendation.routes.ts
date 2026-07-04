import { Router } from "express";
import { createPersonalRecommendation } from "../controllers/recommendation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const recommendationRouter = Router();

recommendationRouter.post("/personal", requireAuth, createPersonalRecommendation);
