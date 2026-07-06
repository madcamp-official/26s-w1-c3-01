import { supabaseAdmin } from "../../config/supabase.js";
import type { CreateMealHistoryRequest, UpdateMealHistoryRequest } from "./mealHistory.dto.js";

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
  },

  async update(userId: number, historyId: number, input: UpdateMealHistoryRequest) {
    const updates: Record<string, unknown> = {};
    if (typeof input.menuId === "number") updates.menu_id = input.menuId;
    if (typeof input.eatenAt === "string") updates.eaten_at = input.eatenAt;
    if (typeof input.rating === "number") updates.rating = input.rating;
    if (typeof input.memo === "string") updates.memo = input.memo;

    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .update(updates)
      .eq("history_id", historyId)
      .eq("user_id", userId)
      .select("history_id, user_id, menu_id, eaten_at, rating, memo")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw Object.assign(new Error("식사 기록을 찾을 수 없습니다."), { status: 404, code: "NOT_FOUND" });
    }
    return data;
  },

  async remove(userId: number, historyId: number) {
    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .delete()
      .eq("history_id", historyId)
      .eq("user_id", userId)
      .select("history_id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw Object.assign(new Error("식사 기록을 찾을 수 없습니다."), { status: 404, code: "NOT_FOUND" });
    }
    return { deleted: true, historyId };
  }
};
