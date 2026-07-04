import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { masterDataService } from "./masterData.service.js";

export const listMenus: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listMenus());
  } catch (error) {
    next(error);
  }
};

export const getMenu: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.getMenu(Number(req.params.menuId)));
  } catch (error) {
    next(error);
  }
};

export const listMenuCategories: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listMenuCategories());
  } catch (error) {
    next(error);
  }
};
export const listTags: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listTags());
  } catch (error) {
    next(error);
  }
};
export const listAllergies: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listAllergies());
  } catch (error) {
    next(error);
  }
};
export const listMeetingPurposes: RequestHandler = async (_req, res, next) => {
  try {
    sendSuccess(res, await masterDataService.listMeetingPurposes());
  } catch (error) {
    next(error);
  }
};
