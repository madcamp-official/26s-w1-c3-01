import type {
  CategoryPreferenceByNameResponse,
  ReplaceCategoryPreferencesByNameRequest,
  UpdateUserPreferenceRequest,
  UserPreferenceResponse
} from "./userPreference.dto.js";
import { userPreferenceRepository } from "./userPreference.repository.js";

export const userPreferenceService = {
  async getUserPreference(userId: number): Promise<UserPreferenceResponse> {
    const row = await userPreferenceRepository.findUserPreference(userId);

    return {
      userId,
      budgetMin: row?.budget_min ?? null,
      budgetMax: row?.budget_max ?? null
    };
  },

  async updateUserPreference(
    userId: number,
    input: UpdateUserPreferenceRequest
  ): Promise<UserPreferenceResponse> {
    const row = await userPreferenceRepository.upsertUserPreference(userId, input);

    return {
      userId: Number(row.user_id),
      budgetMin: row.budget_min ?? null,
      budgetMax: row.budget_max ?? null
    };
  },

  async getCategoryPreferences(userId: number): Promise<CategoryPreferenceByNameResponse[]> {
    const rows = await userPreferenceRepository.findCategoryPreferences(userId);
    return rows.map((row) => toCategoryPreferenceResponse(row));
  },

  async replaceCategoryPreferences(
    userId: number,
    input: ReplaceCategoryPreferencesByNameRequest
  ): Promise<CategoryPreferenceByNameResponse[]> {
    const rows = await userPreferenceRepository.replaceCategoryPreferences(userId, input);
    return rows.map((row) => toCategoryPreferenceResponse(row));
  }
};

function toCategoryPreferenceResponse(row: {
  category_id: number;
  preference_score: number;
  menu_categories?:
    | { category_id: number; name: string }
    | Array<{ category_id: number; name: string }>
    | null;
}) {
  const category = Array.isArray(row.menu_categories)
    ? row.menu_categories[0]
    : row.menu_categories;

  return {
    category: category?.name ?? "",
    categoryId: Number(row.category_id),
    preferenceScore: Number(row.preference_score)
  };
}
