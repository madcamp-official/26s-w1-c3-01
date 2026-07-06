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

export const updateMealHistory: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await mealHistoryService.update(req.auth!.profile!.userId, Number(req.params.historyId), req.body),
      200,
      "식사 기록이 수정되었습니다."
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMealHistory: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await mealHistoryService.remove(req.auth!.profile!.userId, Number(req.params.historyId)),
      200,
      "식사 기록이 삭제되었습니다."
    );
  } catch (error) {
    next(error);
  }
};
