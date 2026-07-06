export type CreateMealHistoryRequest = {
  menuId: number;
  eatenAt?: string;
  rating?: number;
  memo?: string;
  personalRecommendationRunId?: number;
};

export type UpdateMealHistoryRequest = Partial<CreateMealHistoryRequest>;

export type MealHistoryListQuery = {
  limit?: number;
  offset?: number;
};