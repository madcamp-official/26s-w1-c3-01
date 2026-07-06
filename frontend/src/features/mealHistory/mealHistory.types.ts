export type CreateMealHistoryRequest = {
  menuId: number;
  eatenAt?: string;
  rating?: number;
  memo?: string;
};

export type UpdateMealHistoryRequest = Partial<CreateMealHistoryRequest>;
