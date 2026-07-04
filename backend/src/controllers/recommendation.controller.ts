import type { RequestHandler } from "express";
import { ok } from "../utils/apiResponse.js";

export const createPersonalRecommendation: RequestHandler = (_req, res) => {
  ok(res, { results: [] }, "TODO: run personal recommendation baseline");
};
