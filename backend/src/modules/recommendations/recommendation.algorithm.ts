import type {
  PersonalRecommendationRequest,
  RecommendationBaseData,
  RecommendationResult
} from "./recommendation.dto.js";

export function rankPersonalMenus(
  input: PersonalRecommendationRequest,
  base: RecommendationBaseData
): RecommendationResult[] {
  const limit = input.limit ?? 10;
  const excludeRecentDays = input.excludeRecentDays ?? 14;
  const includeNewMenu = input.includeNewMenu ?? true;

  const menuPreferenceMap = toPreferenceMap(base.userMenuPreferences, "menu_id");
  const categoryPreferenceMap = toPreferenceMap(base.userCategoryPreferences, "category_id");
  const tagPreferenceMap = toPreferenceMap(base.userTagPreferences, "tag_id");

  const menuTagsMap = groupIdsByMenu(base.menuTags, "tag_id");
  const menuAllergiesMap = groupIdsByMenu(base.menuAllergies, "allergy_id");
  const userAllergySet = new Set(base.userAllergies.map((row) => Number(row.allergy_id)));

  const recentMenuSet = getRecentMenuSet(base.mealHistory, excludeRecentDays);
  const eatenMenuSet = new Set(base.mealHistory.map((row) => Number(row.menu_id)));
  const ratingAverageMap = getRatingAverageMap(base.mealHistory);
  const purposeSuitabilityMap = getPurposeSuitabilityMap(base, input.meetingPurposeId);

  const scoredMenus = base.menus
    .filter((menu) => !hasUserAllergy(menu.menu_id, menuAllergiesMap, userAllergySet))
    .filter((menu) => !recentMenuSet.has(Number(menu.menu_id)))
    .map((menu) => {
      const menuId = Number(menu.menu_id);
      const tagIds = menuTagsMap.get(menuId) ?? [];
      const reasons: string[] = [];

      let score = 0;

      const menuPreference = menuPreferenceMap.get(menuId) ?? 0;
      if (menuPreference !== 0) {
        score += menuPreference * 20;
        reasons.push(menuPreference > 0 ? "선호 메뉴" : "비선호 메뉴 반영");
      }

      const categoryPreference = categoryPreferenceMap.get(Number(menu.category_id)) ?? 0;
      if (categoryPreference !== 0) {
        score += categoryPreference * 10;
        reasons.push(categoryPreference > 0 ? "선호 카테고리" : "비선호 카테고리 반영");
      }

      const tagScore = tagIds.reduce((sum, tagId) => sum + (tagPreferenceMap.get(tagId) ?? 0), 0);
      if (tagScore !== 0) {
        score += tagScore * 6;
        reasons.push(tagScore > 0 ? "선호 태그 포함" : "비선호 태그 반영");
      }

      const purposeScore = purposeSuitabilityMap.get(menuId) ?? 0;
      if (purposeScore > 0) {
        score += purposeScore * 8;
        reasons.push("식사 목적에 적합");
      }

      const ratingAverage = ratingAverageMap.get(menuId);
      if (ratingAverage !== undefined) {
        score += (ratingAverage - 3) * 8;
        reasons.push("과거 평점 반영");
      }

      const isNewSuggestion = !eatenMenuSet.has(menuId);
      if (includeNewMenu && isNewSuggestion) {
        score += 5;
        reasons.push("새 메뉴 추천");
      }

      return {
        rankNo: 0,
        menuId,
        menuName: menu.name,
        totalScore: roundScore(score),
        reason: reasons.length > 0 ? reasons.join(", ") : "기본 추천 후보",
        isNewSuggestion
      };
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.menuId - b.menuId;
    })
    .slice(0, limit);

  return scoredMenus.map((item, index) => ({
    ...item,
    rankNo: index + 1
  }));
}

function toPreferenceMap<T extends Record<string, unknown>>(rows: T[], idKey: keyof T) {
  return new Map(
    rows.map((row) => [
      Number(row[idKey]),
      Number(row.preference_score ?? 0)
    ])
  );
}

function groupIdsByMenu<T extends Record<string, unknown>>(rows: T[], idKey: keyof T) {
  const map = new Map<number, number[]>();

  for (const row of rows) {
    const menuId = Number(row.menu_id);
    const value = Number(row[idKey]);

    if (!map.has(menuId)) {
      map.set(menuId, []);
    }

    map.get(menuId)!.push(value);
  }

  return map;
}

function hasUserAllergy(
  menuId: number,
  menuAllergiesMap: Map<number, number[]>,
  userAllergySet: Set<number>
) {
  const allergyIds = menuAllergiesMap.get(Number(menuId)) ?? [];
  return allergyIds.some((allergyId) => userAllergySet.has(allergyId));
}

function getRecentMenuSet(mealHistory: RecommendationBaseData["mealHistory"], excludeRecentDays: number) {
  if (excludeRecentDays <= 0) {
    return new Set<number>();
  }

  const cutoff = Date.now() - excludeRecentDays * 24 * 60 * 60 * 1000;

  return new Set(
    mealHistory
      .filter((row) => new Date(row.eaten_at).getTime() >= cutoff)
      .map((row) => Number(row.menu_id))
  );
}

function getRatingAverageMap(mealHistory: RecommendationBaseData["mealHistory"]) {
  const ratings = new Map<number, { total: number; count: number }>();

  for (const row of mealHistory) {
    if (row.rating === null || row.rating === undefined) continue;

    const menuId = Number(row.menu_id);
    const current = ratings.get(menuId) ?? { total: 0, count: 0 };

    ratings.set(menuId, {
      total: current.total + Number(row.rating),
      count: current.count + 1
    });
  }

  return new Map(
    Array.from(ratings.entries()).map(([menuId, value]) => [
      menuId,
      value.total / value.count
    ])
  );
}

function getPurposeSuitabilityMap(
  base: RecommendationBaseData,
  meetingPurposeId?: number
) {
  if (!meetingPurposeId) {
    return new Map<number, number>();
  }

  return new Map(
    base.purposeSuitability
      .filter((row) => Number(row.meeting_purpose_id) === meetingPurposeId)
      .map((row) => [Number(row.menu_id), Number(row.suitability_score)])
  );
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
