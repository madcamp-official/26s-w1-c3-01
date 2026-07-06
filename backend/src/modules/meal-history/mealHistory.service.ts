import { ERROR_CODES } from "../../common/constants/errorCodes.js";
import { mealHistoryRepository } from "./mealHistory.repository.js";
import type {
  CreateMealHistoryRequest,
  MealHistoryListQuery,
  UpdateMealHistoryRequest
} from "./mealHistory.dto.js";

export const mealHistoryService = {
  create(userId: number, input: CreateMealHistoryRequest) {
    return mealHistoryRepository.create(userId, input);
  },

  listMine(userId: number, query: MealHistoryListQuery) {
    return mealHistoryRepository.findByUserId(userId, query);
  },

  async getMine(userId: number, historyId: number) {
    validateHistoryId(historyId);

    const mealHistory = await mealHistoryRepository.findById(userId, historyId);
    if (!mealHistory) throwNotFound();

    return mealHistory;
  },

  async update(userId: number, historyId: number, input: UpdateMealHistoryRequest) {
    validateHistoryId(historyId);

    const mealHistory = await mealHistoryRepository.update(userId, historyId, input);
    if (!mealHistory) throwNotFound();

    return mealHistory;
  },

  async delete(userId: number, historyId: number) {
    validateHistoryId(historyId);

    const deleted = await mealHistoryRepository.delete(userId, historyId);
    if (!deleted) throwNotFound();

    return { deleted: true };
  }
};

function validateHistoryId(historyId: number) {
  if (!Number.isInteger(historyId) || historyId <= 0) {
    throw {
      status: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "식사 기록 ID가 올바르지 않습니다."
    };
  }
}

function throwNotFound(): never {
  throw {
    status: 404,
    code: ERROR_CODES.NOT_FOUND,
    message: "식사 기록을 찾을 수 없습니다."
  };
}
