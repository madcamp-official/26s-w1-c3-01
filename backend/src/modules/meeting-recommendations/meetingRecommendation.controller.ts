import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { meetingRecommendationService } from "./meetingRecommendation.service.js";

export const createMeetingRecommendation: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingRecommendationService.create(Number(req.params.meetingId), req.body), 201);
  } catch (error) {
    next(error);
  }
};

export const getLatestMeetingRecommendation: RequestHandler = (req, res) => {
  sendSuccess(res, { meetingId: Number(req.params.meetingId), results: [] });
};

export const selectMeetingMenu: RequestHandler = (req, res) => {
  sendSuccess(res, { meetingId: Number(req.params.meetingId), selectedMenuId: req.body.menuId, status: "DECIDED" });
};
