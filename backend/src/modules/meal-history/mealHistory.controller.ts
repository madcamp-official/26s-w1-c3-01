import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { mealHistoryService } from "./mealHistory.service.js";

export const createMealHistory: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;

    sendSuccess(
      res,
      await mealHistoryService.create(userId, req.body),
      201,
      "식사 기록이 저장되었습니다."
    );
  } catch (error) {
    next(error);
  }
};

export const listMyMealHistory: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;

    // query string은 문자열로 들어오므로 숫자로 변환해서 service로 넘깁니다.
    sendSuccess(res, await mealHistoryService.listMine(userId, {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined
    }));
  } catch (error) {
    next(error);
  }
};

export const getMealHistory: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const historyId = Number(req.params.historyId);

    sendSuccess(res, await mealHistoryService.getMine(userId, historyId));
  } catch (error) {
    next(error);
  }
};

export const updateMealHistory: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const historyId = Number(req.params.historyId);

    sendSuccess(res, await mealHistoryService.update(userId, historyId, req.body));
  } catch (error) {
    next(error);
  }
};

export const deleteMealHistory: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const historyId = Number(req.params.historyId);

    sendSuccess(res, await mealHistoryService.delete(userId, historyId));
  } catch (error) {
    next(error);
  }
};
