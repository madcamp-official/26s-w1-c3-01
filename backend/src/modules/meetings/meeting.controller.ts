import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { meetingService } from "./meeting.service.js";

export const createMeeting: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.createMeeting(req.auth!.userId, req.body), 201, "모임이 생성되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const listMeetings: RequestHandler = (_req, res) => sendSuccess(res, { items: [] });
export const getMeeting: RequestHandler = (req, res) => sendSuccess(res, { meetingId: Number(req.params.meetingId) });
export const updateMeeting: RequestHandler = (req, res) => sendSuccess(res, { meetingId: Number(req.params.meetingId), ...req.body });
