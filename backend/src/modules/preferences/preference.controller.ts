import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { preferenceService } from "./preference.service.js";

export const getMyPreferences: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await preferenceService.getMyPreferences(req.auth!.userId));
  } catch (error) {
    next(error);
  }
};

export const replaceMyPreferences: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await preferenceService.replaceMyPreferences(req.auth!.userId, req.body));
  } catch (error) {
    next(error);
  }
};
