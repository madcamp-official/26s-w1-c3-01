import type {
  MenuRecommendationFeatureRow,
  PersonalRecommendationRequest,
  RecommendationBaseData,
  RecommendationResult,
  RecommendationScoreBreakdown
} from "./recommendation.dto.js";

type MenuScoringStats = {
  categoryPreference: number;
  tagPreferenceAverage: number;
  menuPreference: number;
  priceLevel: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  isNewMenu: boolean;
  lastEatenAt: string | null;
  recentDuplicateDays: number;
};

type CalculatedScore = {
  total_score: number;
  scores: RecommendationScoreBreakdown;
  reason_tags: string[];
};

const DEFAULT_RECOMMENDATION_LIMIT = 5;
const DEFAULT_MENU_PREFERENCE = 5;
const ALGORITHM_VERSION = "personal-simple-v2" as const;

export function rankPersonalMenus(
  input: PersonalRecommendationRequest,
  base: RecommendationBaseData
): RecommendationResult[] {
  const limit = input.limit ?? DEFAULT_RECOMMENDATION_LIMIT;
  const recentDuplicateDays = input.recentDuplicateDays ?? input.excludeRecentDays ?? 0;
  const categoryPreferenceMap = toPreferenceMap(base.userCategoryPreferences, "category_id");
  const tagPreferenceMap = toPreferenceMap(base.userTagPreferences, "tag_id");
  const menuPreferenceMap = toPreferenceMap(base.userMenuPreferences, "menu_id");
  const userAllergySet = new Set(base.userAllergyIds.map(Number));
  const historyStatsMap = getHistoryStatsMap(base.mealHistory);

  const scoredMenus = base.menus
    .filter((menu) => !hasAllergyConflict(menu, userAllergySet))
    .map((menu) => {
      const menuId = Number(menu.menu_id);
      const historyStats = historyStatsMap.get(menuId);
      const isNewMenu = !historyStats;

      if (input.includeNewMenu === false && isNewMenu) {
        return null;
      }

      const tagIds = normalizeIdArray(menu.tag_ids);
      const calculated = calculatePersonalRecommendationScore({
        categoryPreference: categoryPreferenceMap.get(Number(menu.category_id)) ?? 0,
        tagPreferenceAverage: averagePreferences(tagIds, tagPreferenceMap),
        menuPreference: menuPreferenceMap.get(menuId) ?? historyStats?.ratingAverage ?? DEFAULT_MENU_PREFERENCE,
        priceLevel: menu.price_level,
        budgetMin: base.userPreference?.budget_min ?? null,
        budgetMax: base.userPreference?.budget_max ?? null,
        isNewMenu,
        lastEatenAt: historyStats?.lastEatenAt ?? null,
        recentDuplicateDays
      });

      return {
        rankNo: 0,
        menuId,
        menuName: menu.name,
        categoryName: menu.category_name,
        priceLevel: menu.price_level,
        totalScore: calculated.total_score,
        reason: buildReason(calculated.reason_tags),
        reasonTags: calculated.reason_tags,
        isNewSuggestion: isNewMenu,
        scores: calculated.scores
      };
    })
    .filter((item): item is RecommendationResult => item !== null)
    .sort(compareRecommendationResults)
    .slice(0, limit);

  return scoredMenus.map((item, index) => ({
    ...item,
    rankNo: index + 1
  }));
}

export function calculatePersonalRecommendationScore(stats: MenuScoringStats): CalculatedScore {
  const category_score = calculateCategoryScore(stats.categoryPreference);
  const tag_score = calculateTagScore(stats.tagPreferenceAverage);
  const menu_preference_score = calculateMenuPreferenceScore(stats.menuPreference);
  const budget_score = calculateBudgetScore(stats.priceLevel, stats.budgetMin, stats.budgetMax);
  const new_menu_score = stats.isNewMenu ? 15 : 0;
  const history_penalty = calculateHistoryPenalty(stats.lastEatenAt, stats.recentDuplicateDays);

  const scores: RecommendationScoreBreakdown = {
    category_score,
    tag_score,
    menu_preference_score,
    budget_score,
    new_menu_score,
    history_penalty
  };

  const rawScore = category_score + tag_score + menu_preference_score + budget_score + new_menu_score - history_penalty;

  return {
    total_score: roundScore(clamp(rawScore, 0, 100)),
    scores,
    reason_tags: getReasonTags(scores)
  };
}

export function calculateCategoryScore(preferenceScore: number) {
  return roundScore(clamp(preferenceScore, 0, 5) / 5 * 30);
}

export function calculateTagScore(tagAverage: number) {
  return roundScore(clamp(tagAverage, 0, 5) / 5 * 20);
}

export function calculateMenuPreferenceScore(menuPreference: number) {
  return roundScore(clamp(menuPreference, 0, 5) / 5 * 25);
}

export function calculateBudgetScore(
  priceLevel: number | null,
  budgetMin: number | null,
  budgetMax: number | null
) {
  if (priceLevel === null || budgetMax === null) return 10;
  if (priceLevel > budgetMax) return 5;
  if (budgetMin !== null && priceLevel < budgetMin) return 8;
  return 10;
}

export function calculateHistoryPenalty(lastEatenAt: string | null, recentDuplicateDays: number) {
  if (recentDuplicateDays <= 0 || !lastEatenAt) return 0;

  const daysSinceLastEaten = Math.max(
    0,
    (Date.now() - new Date(lastEatenAt).getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysSinceLastEaten >= recentDuplicateDays) return 0;
  return roundScore(20 * (1 - daysSinceLastEaten / recentDuplicateDays));
}

export function getAlgorithmVersion() {
  return ALGORITHM_VERSION;
}

function toPreferenceMap<T extends Record<string, unknown>>(rows: T[], idKey: keyof T) {
  return new Map<number, number>(
    rows.map((row) => [
      Number(row[idKey]),
      Number(row.preference_score ?? 0)
    ])
  );
}

function normalizeIdArray(value: number[] | string | null | undefined) {
  if (Array.isArray(value)) return value.map(Number);
  if (!value) return [];

  return value
    .replace(/[{}]/g, "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function averagePreferences(ids: number[], preferenceMap: Map<number, number>) {
  const values = ids
    .map((id) => preferenceMap.get(Number(id)))
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hasAllergyConflict(menu: MenuRecommendationFeatureRow, userAllergySet: Set<number>) {
  return normalizeIdArray(menu.allergy_ids).some((allergyId) => userAllergySet.has(allergyId));
}

function getHistoryStatsMap(rows: RecommendationBaseData["mealHistory"]) {
  const map = new Map<number, { lastEatenAt: string; ratingTotal: number; ratingCount: number; ratingAverage?: number }>();

  for (const row of rows) {
    const menuId = Number(row.menu_id);
    const current = map.get(menuId) ?? {
      lastEatenAt: row.eaten_at,
      ratingTotal: 0,
      ratingCount: 0
    };

    if (new Date(row.eaten_at).getTime() > new Date(current.lastEatenAt).getTime()) {
      current.lastEatenAt = row.eaten_at;
    }

    if (row.rating !== null && row.rating !== undefined) {
      current.ratingTotal += Number(row.rating);
      current.ratingCount += 1;
      current.ratingAverage = current.ratingTotal / current.ratingCount;
    }

    map.set(menuId, current);
  }

  return map;
}

function compareRecommendationResults(a: RecommendationResult, b: RecommendationResult) {
  return (
    b.totalScore - a.totalScore ||
    a.scores.history_penalty - b.scores.history_penalty ||
    b.scores.new_menu_score - a.scores.new_menu_score ||
    b.scores.menu_preference_score - a.scores.menu_preference_score ||
    b.scores.category_score - a.scores.category_score ||
    b.scores.tag_score - a.scores.tag_score ||
    b.scores.budget_score - a.scores.budget_score ||
    a.menuName.localeCompare(b.menuName, "ko") ||
    a.menuId - b.menuId
  );
}

function getReasonTags(scores: RecommendationScoreBreakdown) {
  const tags: string[] = [];

  if (scores.category_score >= 24) tags.push("선호도가 높은 카테고리의 메뉴입니다.");
  if (scores.tag_score >= 16) tags.push("선호 태그와 잘 맞는 메뉴입니다.");
  if (scores.menu_preference_score >= 20) tags.push("이전 평가 내역 또는 메뉴 선호도가 높은 메뉴입니다.");
  if (scores.budget_score === 10) tags.push("예산 범위에 잘 맞는 메뉴입니다.");
  if (scores.new_menu_score > 0) tags.push("아직 먹어보지 않은 새로운 메뉴입니다.");
  if (scores.history_penalty > 0) tags.push("최근 식사 기록이 있어 일부 감점되었습니다.");

  return tags.slice(0, 2);
}

function buildReason(reasonTags: string[]) {
  if (reasonTags.length === 0) {
    return "선호도와 식사 기록을 기준으로 추천한 메뉴입니다.";
  }

  return reasonTags.join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
