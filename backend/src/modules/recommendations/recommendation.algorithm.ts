import type { PersonalRecommendationRequest, RecommendationResult } from "./recommendation.dto.js";

type RecommendationBase = {
  menus: any[];
  menuTags: any[];
  menuAllergies: any[];
  categoryPreferences: any[];
  tagPreferences: any[];
  menuPreferences: any[];
  userAllergies: any[];
  history: any[];
};

const DEFAULT_LIMIT = 3;
const DEFAULT_RECENT_DUPLICATE_DAYS = 3;

export function rankPersonalMenus(input: PersonalRecommendationRequest, base: RecommendationBase): RecommendationResult[] {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const recentDuplicateDays = input.recentDuplicateDays ?? input.excludeRecentDays ?? DEFAULT_RECENT_DUPLICATE_DAYS;
  const categoryScoreById = new Map(base.categoryPreferences.map((row) => [Number(row.category_id), Number(row.preference_score)]));
  const tagScoreById = new Map(base.tagPreferences.map((row) => [Number(row.tag_id), Number(row.preference_score)]));
  const menuScoreById = new Map(base.menuPreferences.map((row) => [Number(row.menu_id), Number(row.preference_score)]));
  const allergyIds = new Set(base.userAllergies.map((row) => Number(row.allergy_id)));
  const historyByMenuId = new Map<number, any[]>();

  for (const row of base.history) {
    const menuId = Number(row.menu_id);
    historyByMenuId.set(menuId, [...(historyByMenuId.get(menuId) ?? []), row]);
  }

  return base.menus
    .flatMap((menu) => {
      const menuId = Number(menu.menu_id);
      const menuAllergyIds = base.menuAllergies
        .filter((row) => Number(row.menu_id) === menuId)
        .map((row) => Number(row.allergy_id));
      if (menuAllergyIds.some((allergyId) => allergyIds.has(allergyId))) {
        return [];
      }

      const relatedTagIds = base.menuTags
        .filter((row) => Number(row.menu_id) === menuId)
        .map((row) => Number(row.tag_id));
      const categoryScore = categoryScoreById.get(Number(menu.category_id)) ?? 0;
      const tagScore = relatedTagIds.reduce((sum, tagId) => sum + (tagScoreById.get(tagId) ?? 0), 0);
      const menuScore = menuScoreById.get(menuId) ?? 0;
      const histories = historyByMenuId.get(menuId) ?? [];
      const latestHistory = histories[0];
      const recentPenalty = latestHistory && isWithinDays(latestHistory.eaten_at, recentDuplicateDays) ? 8 : 0;
      const ratingBonus = histories.reduce((sum, row) => sum + (Number(row.rating) || 0), 0);
      const isNewSuggestion = histories.length === 0;

      if (input.includeNewMenu === false && isNewSuggestion && menuScore === 0) {
        return [];
      }

      const rawScore = 50 + categoryScore * 6 + tagScore * 4 + menuScore * 8 + ratingBonus - recentPenalty;
      const totalScore = Math.max(0, Math.min(100, Number(rawScore.toFixed(2))));
      const categoryName = menu.menu_categories?.name ?? "메뉴";
      const reasonParts = [
        categoryScore !== 0 ? `${categoryName} 선호도 ${categoryScore > 0 ? "+" : ""}${categoryScore}` : null,
        tagScore !== 0 ? `태그 선호 합산 ${tagScore > 0 ? "+" : ""}${tagScore}` : null,
        menuScore !== 0 ? `메뉴 선호도 ${menuScore > 0 ? "+" : ""}${menuScore}` : null,
        recentPenalty > 0 ? `최근 ${recentDuplicateDays}일 내 식사로 감점` : null,
        isNewSuggestion ? "새 메뉴 후보" : null
      ].filter(Boolean);

      return [{
        rankNo: 0,
        menuId,
        menuName: menu.name,
        totalScore,
        categoryName,
        reason: reasonParts.join(", ") || "기본 메뉴 데이터와 현재 선호도를 기준으로 계산했습니다.",
        isNewSuggestion
      }];
    })
    .sort((left, right) => right.totalScore - left.totalScore || left.menuName.localeCompare(right.menuName, "ko"))
    .slice(0, limit)
    .map((item, index) => ({ ...item, rankNo: index + 1 }));
}

function isWithinDays(value: string, days: number) {
  if (days <= 0) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const diffMs = Date.now() - date.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}
