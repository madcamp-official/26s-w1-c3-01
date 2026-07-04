import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import {
  createMeetingRecommendation,
  getLatestMeetingRecommendation,
  selectMeetingMenu
} from "./meetingRecommendation.controller.js";

export const meetingRecommendationRouter = Router({ mergeParams: true });

meetingRecommendationRouter.post("/:meetingId/recommendations", authMiddleware, createMeetingRecommendation);
meetingRecommendationRouter.get("/:meetingId/recommendations/latest", authMiddleware, getLatestMeetingRecommendation);
meetingRecommendationRouter.patch("/:meetingId/selected-menu", authMiddleware, selectMeetingMenu);
