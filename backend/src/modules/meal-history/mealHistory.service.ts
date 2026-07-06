import { mealHistoryRepository } from "./mealHistory.repository.js";
import type { CreateMealHistoryRequest, UpdateMealHistoryRequest } from "./mealHistory.dto.js";

export const mealHistoryService = {
  listMine(userId: number) {
    return mealHistoryRepository.listByUserId(userId);
  },

  create(userId: number, input: CreateMealHistoryRequest) {
    return mealHistoryRepository.create(userId, input);
  },

  update(userId: number, historyId: number, input: UpdateMealHistoryRequest) {
    return mealHistoryRepository.update(userId, historyId, input);
  },

  remove(userId: number, historyId: number) {
    return mealHistoryRepository.remove(userId, historyId);
  }
};
