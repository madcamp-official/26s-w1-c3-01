import type { CreateMealHistoryRequest } from "./mealHistory.dto.js";

export const mealHistoryRepository = {
  async create(userId: number, input: CreateMealHistoryRequest) {
    return { historyId: null, userId, ...input };
  }
};
