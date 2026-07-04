import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { meetingService } from "./meeting.service.js";

export const createMeeting: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;

    sendSuccess(
      res,
      await meetingService.createMeeting(userId, req.body),
      201,
      "모임이 생성되었습니다."
    );
  } catch (error) {
    next(error);
  }
};

export const listMeetings: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;

    // query string은 문자열이므로 controller에서 숫자로 변환합니다.
    sendSuccess(res, await meetingService.listMeetings(userId, {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
      status: req.query.status as never
    }));
  } catch (error) {
    next(error);
  }
};

export const getMeeting: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(res, await meetingService.getMeeting(userId, meetingId));
  } catch (error) {
    next(error);
  }
};

export const updateMeeting: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(res, await meetingService.updateMeeting(userId, meetingId, req.body));
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(res, await meetingService.deleteMeeting(userId, meetingId));
  } catch (error) {
    next(error);
  }
};

export const listMeetingParticipants: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(res, await meetingService.listParticipants(userId, meetingId));
  } catch (error) {
    next(error);
  }
};

export const addMeetingParticipant: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);

    sendSuccess(
      res,
      await meetingService.addParticipant(userId, meetingId, req.body),
      201,
      "참여자가 추가되었습니다."
    );
  } catch (error) {
    next(error);
  }
};

export const updateMeetingParticipant: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const meetingId = Number(req.params.meetingId);
    const participantId = Number(req.params.participantId);

    sendSuccess(
      res,
      await meetingService.updateParticipant(userId, meetingId, participantId, req.body)
    );
  } catch (error) {
    next(error);
  }
};