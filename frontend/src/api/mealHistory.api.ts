import { apiRequest } from "./client";
import type { CreateMealHistoryRequest, UpdateMealHistoryRequest } from "../features/mealHistory/mealHistory.types";

export const mealHistoryApi = {
  listMine() {
    return apiRequest("/meal-history/me");
  },
  create(body: CreateMealHistoryRequest) {
    return apiRequest("/meal-history", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  update(historyId: number, body: UpdateMealHistoryRequest) {
    return apiRequest(`/meal-history/${historyId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },
  remove(historyId: number) {
    return apiRequest(`/meal-history/${historyId}`, {
      method: "DELETE"
    });
  }
};
