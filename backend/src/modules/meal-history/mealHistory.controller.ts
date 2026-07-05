import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { mealHistoryService } from "./mealHistory.service.js";

export const createMealHistory: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await mealHistoryService.create(req.auth!.profile!.userId, req.body), 201, "식사 기록이 저장되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const listMyMealHistory: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await mealHistoryService.listMine(req.auth!.profile!.userId));
  } catch (error) {
    next(error);
  }
};
export const getMealHistory: RequestHandler = (req, res) => sendSuccess(res, { historyId: Number(req.params.historyId) });
export const updateMealHistory: RequestHandler = (req, res) => sendSuccess(res, { historyId: Number(req.params.historyId), ...req.body });
export const deleteMealHistory: RequestHandler = (_req, res) => sendSuccess(res, { deleted: true });
