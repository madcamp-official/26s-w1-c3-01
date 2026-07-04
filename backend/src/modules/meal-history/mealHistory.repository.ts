import { supabaseAdmin } from "../../config/supabase.js";
import type { CreateMealHistoryRequest } from "./mealHistory.dto.js";

export const mealHistoryRepository = {
  async create(userId: number, input: CreateMealHistoryRequest) {
    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .insert({
        user_id: userId,
        menu_id: input.menuId,
        eaten_at: input.eatenAt ?? new Date().toISOString(),
        rating: input.rating ?? null,
        memo: input.memo ?? null
      })
      .select("history_id, user_id, menu_id, eaten_at, rating, memo")
      .single();

    if (error) throw error;
    return data;
  }
};
