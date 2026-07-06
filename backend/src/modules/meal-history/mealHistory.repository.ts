import { ERROR_CODES } from "../../common/constants/errorCodes.js";
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
    await assertPersonalRecommendationRunOwner(userId, input.personalRecommendationRunId);

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
    let builder = supabaseAdmin
      .from("meal_history")
      .select(mealHistorySelect, query.includeTotal ? { count: "exact" } : undefined)
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false })
      .range(offset, offset + limit - 1);
    const { data, error, count } = await builder;

    if (error) throw error;

    return {
      items: data ?? [],
      pagination: {
        limit,
        offset,
        total: query.includeTotal ? count ?? 0 : offset + (data?.length ?? 0)
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
    await assertPersonalRecommendationRunOwner(userId, input.personalRecommendationRunId);

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

async function assertPersonalRecommendationRunOwner(userId: number, runId?: number) {
  if (runId === undefined) return;

  const { data, error } = await supabaseAdmin
    .from("personal_recommendation_runs")
    .select("run_id")
    .eq("run_id", runId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw {
      status: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: "본인의 개인 추천 기록만 식사 기록에 연결할 수 있습니다."
    };
  }
}
