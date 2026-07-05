import { supabaseAdmin } from "../../config/supabase.js";
import type { CreateMealHistoryRequest } from "./mealHistory.dto.js";

export const mealHistoryRepository = {
  async listByUserId(userId: number) {
    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .select("history_id, user_id, menu_id, eaten_at, rating, memo, menus(menu_id, name)")
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false });

    if (error) throw error;
    return {
      items: (data ?? []).map((row: any) => ({
        historyId: Number(row.history_id),
        userId: Number(row.user_id),
        menuId: Number(row.menu_id),
        menuName: row.menus?.name,
        eatenAt: row.eaten_at,
        rating: row.rating == null ? null : Number(row.rating),
        memo: row.memo
      }))
    };
  },

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
