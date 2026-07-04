import { apiRequest } from "./client";
import type { CreateMealHistoryRequest } from "../features/mealHistory/mealHistory.types";

export const mealHistoryApi = {
  listMine() {
    return apiRequest("/meal-history/me");
  },
  create(body: CreateMealHistoryRequest) {
    return apiRequest("/meal-history", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
};
