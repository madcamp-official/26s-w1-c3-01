import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { mealHistoryService } from "./mealHistory.service.js";

export const createMealHistory: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, await mealHistoryService.create(req.auth!.userId, req.body), 201, "식사 기록이 저장되었습니다.");
  } catch (error) {
    next(error);
  }
};

export const listMyMealHistory: RequestHandler = (_req, res) => sendSuccess(res, { items: [] });
export const updateMealHistory: RequestHandler = (req, res) => sendSuccess(res, { historyId: Number(req.params.historyId), ...req.body });
export const deleteMealHistory: RequestHandler = (_req, res) => sendSuccess(res, { deleted: true });
