export type UpdateUserPreferenceRequest = {
  budgetMin: number | null;
  budgetMax: number | null;
};

export type UserPreferenceResponse = {
  userId: number;
  budgetMin: number | null;
  budgetMax: number | null;
};

export type CategoryPreferenceByNameInput = {
  category: string;
  preferenceScore: number;
};

export type ReplaceCategoryPreferencesByNameRequest = {
  preferences: CategoryPreferenceByNameInput[];
};

export type CategoryPreferenceByNameResponse = {
  category: string;
  categoryId: number;
  preferenceScore: number;
};
