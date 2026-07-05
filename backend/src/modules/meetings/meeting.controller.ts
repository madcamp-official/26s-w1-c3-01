import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { meetingService } from "./meeting.service.js";

export const createMeeting: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.createMeeting(req.auth!.profile!.userId, req.body), 201, "모임이 생성되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const listMeetings: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.listMeetings(req.auth!.profile!.userId));
  } catch (error) {
    next(error);
  }
};

export const getMeeting: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.getMeeting(Number(req.params.meetingId), req.auth!.profile!.userId));
  } catch (error) {
    next(error);
  }
};

export const previewMeeting: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.previewMeeting(Number(req.params.meetingId)));
  } catch (error) {
    next(error);
  }
};

export const updateMeeting: RequestHandler = (req, res) => sendSuccess(res, { meetingId: Number(req.params.meetingId), ...req.body });

export const addMeetingParticipant: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.addParticipant(Number(req.params.meetingId), req.body), 201, "참여자를 추가했습니다.");
  } catch (error) {
    next(error);
  }
};

export const joinMeeting: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await meetingService.joinMeeting(Number(req.params.meetingId), req.auth!.profile!.userId, req.body),
      201,
      "모임에 참여했습니다."
    );
  } catch (error) {
    next(error);
  }
};

export const listMeetingParticipants: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await meetingService.listParticipants(Number(req.params.meetingId)));
  } catch (error) {
    next(error);
  }
};
