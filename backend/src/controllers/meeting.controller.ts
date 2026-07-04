import type { RequestHandler } from "express";
import { created, ok } from "../utils/apiResponse.js";

export const createMeeting: RequestHandler = (_req, res) => {
  created(res, null, "TODO: create meeting");
};

export const listMeetings: RequestHandler = (_req, res) => {
  ok(res, []);
};

export const getMeeting: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: return meeting detail");
};

export const updateMeeting: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: update meeting");
};

export const addParticipant: RequestHandler = (_req, res) => {
  created(res, null, "TODO: add meeting participant");
};

export const listParticipants: RequestHandler = (_req, res) => {
  ok(res, []);
};

export const updateParticipant: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: update participant attendance status");
};
