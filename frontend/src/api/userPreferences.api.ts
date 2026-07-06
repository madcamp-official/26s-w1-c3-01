import { apiRequest } from "./client";

export type UserPreferenceResponse = {
  userId: number;
  budgetMin: number | null;
  budgetMax: number | null;
};

export type UpdateUserPreferenceRequest = {
  budgetMin: number | null;
  budgetMax: number | null;
};

export const userPreferencesApi = {
  get() {
    return apiRequest<UserPreferenceResponse>("/user-preferences");
  },

  update(body: UpdateUserPreferenceRequest) {
    return apiRequest<UserPreferenceResponse>("/user-preferences", {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }
};
