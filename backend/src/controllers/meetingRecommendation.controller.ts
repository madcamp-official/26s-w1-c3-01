import type { RequestHandler } from "express";
import { created, ok } from "../utils/apiResponse.js";

export const createMeetingRecommendation: RequestHandler = (_req, res) => {
  created(res, { results: [] }, "TODO: run meeting recommendation baseline");
};

export const getLatestMeetingRecommendation: RequestHandler = (_req, res) => {
  ok(res, { results: [] });
};

export const selectMeetingMenu: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: save selected menu and mark meeting as decided");
};
