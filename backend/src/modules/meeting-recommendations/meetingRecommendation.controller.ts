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

export const getLatestMeetingRecommendation: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingRecommendationService.latest(Number(req.params.meetingId)));
  } catch (error) {
    next(error);
  }
};

export const selectMeetingMenu: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await meetingRecommendationService.selectMenu(Number(req.params.meetingId), Number(req.body.menuId), req.auth!.profile!)
    );
  } catch (error) {
    next(error);
  }
};
