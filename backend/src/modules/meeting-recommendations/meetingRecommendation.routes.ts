import { Router } from "express";
import { authMiddleware } from "../../common/middlewares/auth.middleware.js";
import { validateBody } from "../../common/middlewares/validate.middleware.js";
import {
  createMeetingRecommendation,
  getLatestMeetingRecommendation,
  selectMeetingMenu
} from "./meetingRecommendation.controller.js";
import {
  createMeetingRecommendationSchema,
  selectMeetingMenuSchema
} from "./meetingRecommendation.validation.js";

export const meetingRecommendationRouter = Router({ mergeParams: true });

meetingRecommendationRouter.post(
  "/:meetingId/recommendations",
  authMiddleware,
  validateBody(createMeetingRecommendationSchema),
  createMeetingRecommendation
);

meetingRecommendationRouter.get(
  "/:meetingId/recommendations/latest",
  authMiddleware,
  getLatestMeetingRecommendation
);

meetingRecommendationRouter.patch(
  "/:meetingId/selected-menu",
  authMiddleware,
  validateBody(selectMeetingMenuSchema),
  selectMeetingMenu
);