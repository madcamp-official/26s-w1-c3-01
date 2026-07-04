import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { meetingRecommendationService } from "./meetingRecommendation.service.js";

export const createMeetingRecommendation: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(
      res,
      await meetingRecommendationService.create(userId, meetingId, req.body),
      201,
      "모임 추천이 생성되었습니다."
    );
  } catch (error) {
    next(error);
  }
};

export const getLatestMeetingRecommendation: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(res, await meetingRecommendationService.getLatest(userId, meetingId));
  } catch (error) {
    next(error);
  }
};

export const selectMeetingMenu: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(
      res,
      await meetingRecommendationService.selectMenu(userId, meetingId, Number(req.body.menuId)),
      200,
      "모임 메뉴가 확정되었습니다."
    );
  } catch (error) {
    next(error);
  }
};