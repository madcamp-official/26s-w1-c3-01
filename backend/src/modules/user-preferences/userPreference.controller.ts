import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { userPreferenceService } from "./userPreference.service.js";

export const getUserPreference: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    sendSuccess(res, await userPreferenceService.getUserPreference(userId));
  } catch (error) {
    next(error);
  }
};

export const updateUserPreference: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    sendSuccess(res, await userPreferenceService.updateUserPreference(userId, req.body));
  } catch (error) {
    next(error);
  }
};

export const getCategoryPreferences: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    sendSuccess(res, await userPreferenceService.getCategoryPreferences(userId));
  } catch (error) {
    next(error);
  }
};

export const replaceCategoryPreferences: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    sendSuccess(res, await userPreferenceService.replaceCategoryPreferences(userId, req.body));
  } catch (error) {
    next(error);
  }
};
