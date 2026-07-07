import { supabaseAdmin } from "../../config/supabase.js";
import type {
  ReplaceCategoryPreferencesByNameRequest,
  UpdateUserPreferenceRequest
} from "./userPreference.dto.js";

type CategoryRow = {
  category_id: number;
  name: string;
};

export const userPreferenceRepository = {
  async findUserPreference(userId: number) {
    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .select("user_id, budget_min, budget_max")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertUserPreference(userId: number, input: UpdateUserPreferenceRequest) {
    const { data, error } = await supabaseAdmin
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          budget_min: input.budgetMin,
          budget_max: input.budgetMax
        },
        { onConflict: "user_id" }
      )
      .select("user_id, budget_min, budget_max")
      .single();

    if (error) throw error;
    return data;
  },

  async findCategoryPreferences(userId: number) {
    const { data, error } = await supabaseAdmin
      .from("user_category_preferences")
      .select("category_id, preference_score, menu_categories(category_id, name)")
      .eq("user_id", userId)
      .order("category_id");

    if (error) throw error;
    return data ?? [];
  },

  async replaceCategoryPreferences(userId: number, input: ReplaceCategoryPreferencesByNameRequest) {
    const categoryNames = input.preferences.map((item) => item.category);
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from("menu_categories")
      .select("category_id, name")
      .in("name", categoryNames);

    if (categoriesError) throw categoriesError;

    const categoryMap = new Map(
      ((categories ?? []) as CategoryRow[]).map((category) => [category.name, category])
    );
    const missingCategory = categoryNames.find((name) => !categoryMap.has(name));

    if (missingCategory) {
      throw Object.assign(new Error(`존재하지 않는 카테고리입니다: ${missingCategory}`), {
        status: 404,
        code: "NOT_FOUND"
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_category_preferences")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    if (input.preferences.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_category_preferences")
        .insert(
          input.preferences.map((item) => {
            const category = categoryMap.get(item.category)!;

            return {
              user_id: userId,
              category_id: category.category_id,
              preference_score: item.preferenceScore
            };
          })
        );

      if (insertError) throw insertError;
    }

    return this.findCategoryPreferences(userId);
  }
};
