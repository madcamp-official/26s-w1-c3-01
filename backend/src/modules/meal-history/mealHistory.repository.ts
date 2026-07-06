import { supabaseAdmin } from "../../config/supabase.js";
import type {
  CreateMealHistoryRequest,
  MealHistoryListQuery,
  UpdateMealHistoryRequest
} from "./mealHistory.dto.js";

const mealHistorySelect = `
  history_id,
  user_id,
  menu_id,
  eaten_at,
  rating,
  memo,
  personal_recommendation_run_id,
  created_at,
  menus(menu_id, name, description)
`;

export const mealHistoryRepository = {
  async create(userId: number, input: CreateMealHistoryRequest) {
    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .insert({
        user_id: userId,
        menu_id: input.menuId,
        eaten_at: input.eatenAt ?? new Date().toISOString(),
        rating: input.rating ?? null,
        memo: input.memo ?? null,
        personal_recommendation_run_id: input.personalRecommendationRunId ?? null
      })
      .select(mealHistorySelect)
      .single();

    if (error) throw error;
    return data;
  },

  async findByUserId(userId: number, query: MealHistoryListQuery = {}) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    // 최신 식사 기록이 먼저 보이도록 eaten_at 기준 내림차순 정렬합니다.
    const { data, error, count } = await supabaseAdmin
      .from("meal_history")
      .select(mealHistorySelect, { count: "exact" })
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      items: data ?? [],
      pagination: {
        limit,
        offset,
        total: count ?? 0
      }
    };
  },

  async findById(userId: number, historyId: number) {
    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .select(mealHistorySelect)
      .eq("user_id", userId)
      .eq("history_id", historyId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async update(userId: number, historyId: number, input: UpdateMealHistoryRequest) {
    // undefined인 값은 업데이트 대상에서 제외합니다.
    const patch = {
      ...(input.menuId !== undefined && { menu_id: input.menuId }),
      ...(input.eatenAt !== undefined && { eaten_at: input.eatenAt }),
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.memo !== undefined && { memo: input.memo }),
      ...(input.personalRecommendationRunId !== undefined && {
        personal_recommendation_run_id: input.personalRecommendationRunId
      })
    };

    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .update(patch)
      .eq("user_id", userId)
      .eq("history_id", historyId)
      .select(mealHistorySelect)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(userId: number, historyId: number) {
    // 삭제된 row를 다시 받아서 실제 삭제 여부를 확인합니다.
    const { data, error } = await supabaseAdmin
      .from("meal_history")
      .delete()
      .eq("user_id", userId)
      .eq("history_id", historyId)
      .select("history_id")
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};