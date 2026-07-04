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

export const listMenuCategories: RequestHandler = (_req, res) => sendSuccess(res, []);
export const listTags: RequestHandler = (_req, res) => sendSuccess(res, []);
export const listAllergies: RequestHandler = (_req, res) => sendSuccess(res, []);
export const listMeetingPurposes: RequestHandler = (_req, res) => sendSuccess(res, []);
