import type {
  MenuRow,
  PersonalRecommendationRequest,
  RecommendationBaseData,
  RecommendationResult,
  RecommendationScoreBreakdown,
  UserMenuInteractionRow
} from "./recommendation.dto.js";

type MenuScoringStats = {
  categoryPreferenceScore?: number;
  ratingAverage?: number;
  reviewCount: number;
  priceLevel: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  popularityRaw: number;
  maxPopularityRaw: number;
  userPickCount: number;
  recentPickCount7d: number;
  hasRecentDislike30d: boolean;
};

type CalculatedScore = {
  total_score: number;
  scores: RecommendationScoreBreakdown;
  reason_tags: string[];
  is_new_suggestion: boolean;
};

const DEFAULT_RECOMMENDATION_LIMIT = 5;
const DEFAULT_RATING_AVERAGE = 3.8;
const ALGORITHM_VERSION = "personal-weighted-v1" as const;

export function rankPersonalMenus(
  input: PersonalRecommendationRequest,
  base: RecommendationBaseData
): RecommendationResult[] {
  const limit = input.limit ?? DEFAULT_RECOMMENDATION_LIMIT;
  const categoryPreferenceMap = toPreferenceMap(base.userCategoryPreferences, "category_id");
  const menuAllergiesMap = groupIdsByMenu(base.menuAllergies, "allergy_id");
  const userAllergySet = new Set<number>(base.userAllergies.map((row) => Number(row.allergy_id)));
  const ratingStatsMap = getRatingStatsMap(base);
  const popularityRawMap = getPopularityRawMap(base);
  const maxPopularityRaw = Math.max(0, ...Array.from(popularityRawMap.values()));
  const pickCountMap = getUserPickCountMap(base);
  const recentPickCount7dMap = getRecentPickCount7dMap(base);
  const recentDislike30dSet = getRecentDislike30dSet(base.userMenuInteractions);

  const scoredMenus = base.menus
    // 알러지/제한 조건에 걸리는 메뉴는 점수 계산 전에 완전히 제외한다.
    .filter((menu) => !hasUserAllergy(menu.menu_id, menuAllergiesMap, userAllergySet))
    .map((menu) => {
      const menuId = Number(menu.menu_id);
      const ratingStats = ratingStatsMap.get(menuId);
      const calculated = calculatePersonalRecommendationScore(menu, {
        categoryPreferenceScore: categoryPreferenceMap.get(Number(menu.category_id)),
        ratingAverage: ratingStats?.average,
        reviewCount: ratingStats?.count ?? 0,
        priceLevel: menu.price_level,
        budgetMin: base.userPreference?.budget_min ?? null,
        budgetMax: base.userPreference?.budget_max ?? null,
        popularityRaw: popularityRawMap.get(menuId) ?? 0,
        maxPopularityRaw,
        userPickCount: pickCountMap.get(menuId) ?? 0,
        recentPickCount7d: recentPickCount7dMap.get(menuId) ?? 0,
        hasRecentDislike30d: recentDislike30dSet.has(menuId)
      });

      return {
        rankNo: 0,
        menuId,
        menuName: menu.name,
        categoryName: getCategoryName(menu),
        priceLevel: menu.price_level,
        totalScore: calculated.total_score,
        reason: buildReason(calculated.reason_tags),
        reasonTags: calculated.reason_tags,
        isNewSuggestion: calculated.is_new_suggestion,
        scores: calculated.scores
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

export function calculatePersonalRecommendationScore(
  _menu: MenuRow,
  stats: MenuScoringStats
): CalculatedScore {
  const category_score = calculateCategoryScore(stats.categoryPreferenceScore);
  const rating_score = calculateRatingScore(stats.ratingAverage ?? DEFAULT_RATING_AVERAGE);
  const review_confidence_score = calculateReviewConfidenceScore(stats.reviewCount);
  const price_score = calculatePriceScore(stats.priceLevel, stats.budgetMin, stats.budgetMax);
  const popularity_score = calculatePopularityScore(stats.popularityRaw, stats.maxPopularityRaw);
  const novelty_score = calculateNoveltyScore(stats.userPickCount);
  const repeat_score = calculateRepeatScore(stats.recentPickCount7d);
  const negative_feedback_score = stats.hasRecentDislike30d ? 0 : 5;

  const scores: RecommendationScoreBreakdown = {
    category_score,
    rating_score,
    review_confidence_score,
    price_score,
    popularity_score,
    novelty_score,
    repeat_score,
    negative_feedback_score
  };

  const total_score = roundScore(
    clamp(
      Object.values(scores).reduce((sum, score) => sum + score, 0),
      0,
      100
    )
  );

  return {
    total_score,
    scores,
    reason_tags: getReasonTags(scores, stats),
    is_new_suggestion: stats.userPickCount === 0
  };
}

export function calculateCategoryScore(preferenceScore?: number) {
  return roundScore(clamp(10 + 2 * (preferenceScore ?? 0), 0, 20));
}

export function calculateRatingScore(ratingAverage: number) {
  const normalizedRating = clamp((ratingAverage - 1) / 4, 0, 1);
  return roundScore(clamp(20 * Math.pow(normalizedRating, 1.5), 0, 20));
}

export function calculateReviewConfidenceScore(reviewCount: number) {
  return roundScore(clamp(10 * (1 - Math.exp(-Math.max(0, reviewCount) / 20)), 0, 10));
}

export function calculatePriceScore(
  priceLevel: number | null,
  budgetMin: number | null,
  budgetMax: number | null
) {
  // 현재 DB에는 실제 가격이 없고 price_level(1~5)만 있어 예산도 같은 단계값으로 해석한다.
  const price = priceLevel ?? null;
  const min = budgetMin ?? null;
  const max = budgetMax ?? null;

  if (price === null || max === null || max <= 0) {
    return 10;
  }

  if (min !== null && min > 0 && price < min) {
    return roundScore(clamp(12 + 3 * (price / min), 0, 15));
  }

  if ((min === null || price >= min) && price <= max) {
    return 15;
  }

  return roundScore(clamp(15 * Math.exp(-(price - max) / max), 0, 15));
}

export function calculatePopularityScore(popularityRaw: number, maxPopularityRaw: number) {
  if (maxPopularityRaw <= 0) {
    return 7.5;
  }

  return roundScore(
    clamp(
      15 * (Math.log(1 + Math.max(0, popularityRaw)) / Math.log(1 + maxPopularityRaw)),
      0,
      15
    )
  );
}

export function calculateNoveltyScore(userPickCount: number) {
  return roundScore(clamp(10 * Math.exp(-Math.max(0, userPickCount) / 3), 0, 10));
}

export function calculateRepeatScore(recentPickCount7d: number) {
  return roundScore(clamp(5 * Math.exp(-Math.max(0, recentPickCount7d) / 2), 0, 5));
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

function getRatingStatsMap(base: RecommendationBaseData) {
  return new Map(
    base.ratingStats.map((row) => [
      Number(row.menu_id),
      {
        average: Number(row.rating_average),
        count: Number(row.rating_count)
      }
    ])
  );
}

function getPopularityRawMap(base: RecommendationBaseData) {
  return new Map(base.popularityStats.map((row) => [Number(row.menu_id), Number(row.popularity_raw)]));
}

function getUserPickCountMap(base: RecommendationBaseData) {
  const map = new Map<number, number>();

  for (const row of base.userMenuInteractions) {
    if (row.interaction_type !== "pick") continue;
    const menuId = Number(row.menu_id);
    map.set(menuId, (map.get(menuId) ?? 0) + 1);
  }

  for (const row of base.mealHistory) {
    const menuId = Number(row.menu_id);
    map.set(menuId, (map.get(menuId) ?? 0) + 1);
  }

  return map;
}

function getRecentPickCount7dMap(base: RecommendationBaseData) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const map = new Map<number, number>();

  for (const row of base.userMenuInteractions) {
    if (row.interaction_type !== "pick") continue;
    if (new Date(row.created_at).getTime() < cutoff) continue;

    const menuId = Number(row.menu_id);
    map.set(menuId, (map.get(menuId) ?? 0) + 1);
  }

  for (const row of base.mealHistory) {
    if (new Date(row.eaten_at).getTime() < cutoff) continue;

    const menuId = Number(row.menu_id);
    map.set(menuId, (map.get(menuId) ?? 0) + 1);
  }

  return map;
}

function getRecentDislike30dSet(rows: UserMenuInteractionRow[]) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const set = new Set<number>();

  for (const row of rows) {
    if (row.interaction_type !== "dislike") continue;
    if (new Date(row.created_at).getTime() < cutoff) continue;

    set.add(Number(row.menu_id));
  }

  return set;
}

function getReasonTags(scores: RecommendationScoreBreakdown, stats: MenuScoringStats) {
  const tags: string[] = [];

  if (scores.category_score >= 16) tags.push("선호도가 높은 카테고리의 메뉴입니다.");
  if (scores.rating_score >= 15) tags.push("평점이 높은 메뉴입니다.");
  if (scores.review_confidence_score >= 6) tags.push("리뷰 수가 충분해 신뢰도가 높은 메뉴입니다.");
  if (scores.price_score >= 14) tags.push("사용자의 예산 범위에 잘 맞는 메뉴입니다.");
  if (scores.popularity_score >= 11) tags.push("많은 사용자가 선택한 인기 메뉴입니다.");
  if (scores.novelty_score >= 8) tags.push("아직 자주 선택하지 않은 새로운 메뉴입니다.");
  if (scores.repeat_score >= 4) tags.push("최근 반복 선택이 적어 추천하기 적합합니다.");
  if (stats.hasRecentDislike30d) tags.push("최근 부정 피드백이 있어 점수가 낮게 반영되었습니다.");

  return tags.slice(0, 2);
}

function buildReason(reasonTags: string[]) {
  if (reasonTags.length === 0) {
    return "전체 선호도와 이용 기록을 기준으로 추천한 메뉴입니다.";
  }

  return reasonTags.join(" ");
}

function getCategoryName(menu: MenuRow) {
  const category = Array.isArray(menu.menu_categories)
    ? menu.menu_categories[0]
    : menu.menu_categories;

  return category?.name ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
