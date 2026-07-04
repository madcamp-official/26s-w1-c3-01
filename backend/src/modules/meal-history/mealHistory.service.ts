import { mealHistoryRepository } from "./mealHistory.repository.js";
import type { CreateMealHistoryRequest } from "./mealHistory.dto.js";

export const mealHistoryService = {
  create(userId: number, input: CreateMealHistoryRequest) {
    return mealHistoryRepository.create(userId, input);
  }
};
