import type {
  MeetingRecommendationConfig,
  MeetingRecommendationRequest,
  MeetingRecommendationResult
} from "./meetingRecommendation.dto.js";

type MeetingRecommendationBase = {
  participants: Array<{ user_id: number | null }>;
  menus: Array<{
    menu_id: number;
    category_id: number;
    name: string;
  }>;
  menuTags: Array<{ menu_id: number; tag_id: number }>;
  menuAllergies: Array<{ menu_id: number; allergy_id: number }>;
  purposeSuitability: Array<{
    menu_id: number;
    meeting_purpose_id: number;
    suitability_score: number;
  }>;
  userMenuPreferences: Array<{
    user_id: number;
    menu_id: number;
    preference_score: number;
  }>;
  userCategoryPreferences: Array<{
    user_id: number;
    category_id: number;
    preference_score: number;
  }>;
  userTagPreferences: Array<{
    user_id: number;
    tag_id: number;
    preference_score: number;
  }>;
  userAllergies: Array<{
    user_id: number;
    allergy_id: number;
  }>;
  mealHistory: Array<{
    user_id: number;
    menu_id: number;
    rating: number | null;
    eaten_at: string;
  }>;
};

const DEFAULT_CONFIG: MeetingRecommendationConfig = {
  menuPreference: 0.5,
  categoryPreference: 0.3,
  tagPreference: 0.2,
  averageScore: 0.7,
  minimumScore: 0.3,
  strongDislikePenalty: 20,
  strongDislikeScore: -3,
  recentDuplicateDays: 3,
  resultLimit: 3
};

export function createMeetingRecommendationConfig(
  input: MeetingRecommendationRequest
): MeetingRecommendationConfig {
  return {
    ...DEFAULT_CONFIG,
    // 새 필드가 우선이고, 기존 personal recommendation 호환 필드도 허용합니다.
    recentDuplicateDays:
      input.recentDuplicateDays ??
      input.excludeRecentDays ??
      DEFAULT_CONFIG.recentDuplicateDays,
    resultLimit:
      input.resultLimit ??
      input.limit ??
      DEFAULT_CONFIG.resultLimit,
    participantUserIds: input.participantUserIds
  };
}

export function rankMeetingMenus(
  base: MeetingRecommendationBase,
  config: MeetingRecommendationConfig
): MeetingRecommendationResult[] {
  const participantUserIds = base.participants
    .map((participant) => participant.user_id)
    .filter((userId): userId is number => userId !== null);

  const participantCount = Math.max(participantUserIds.length, 1);

  const menuTagsMap = groupByMenu(base.menuTags, "tag_id");
  const menuAllergiesMap = groupByMenu(base.menuAllergies, "allergy_id");

  const allergySet: Set<number> = new Set(
    base.userAllergies.map((row) => Number(row.allergy_id))
  );

  const recentMenuSet = getRecentMenuSet(base.mealHistory, config.recentDuplicateDays);

  const purposeScoreMap: Map<number, number> = new Map(
    base.purposeSuitability.map((row) => [
      Number(row.menu_id),
      Number(row.suitability_score)
    ])
  );

  const menuPreferenceMap = groupPreference(base.userMenuPreferences, "menu_id");
  const categoryPreferenceMap = groupPreference(base.userCategoryPreferences, "category_id");
  const tagPreferenceMap = groupPreference(base.userTagPreferences, "tag_id");
  const ratingMap = groupRatings(base.mealHistory);

  return base.menus
    .filter((menu) => !hasAllergy(menu.menu_id, menuAllergiesMap, allergySet))
    .filter((menu) => !recentMenuSet.has(Number(menu.menu_id)))
    .map((menu): MeetingRecommendationResult | null => {
      const menuId = Number(menu.menu_id);
      const categoryId = Number(menu.category_id);
      const tagIds = menuTagsMap.get(menuId) ?? [];
      const purposeScore = purposeScoreMap.get(menuId) ?? 0;
      const reasons: string[] = [];

      // 목적 적합도가 0인 메뉴는 문서 기준에 따라 추천 후보에서 제외합니다.
      if (purposeScore <= 0) {
        return null;
      }

      let totalScore = purposeScore * 20;
      reasons.push("모임 목적에 적합");

      const menuPreferenceScore = average(
        menuPreferenceMap.get(menuId) ?? [],
        participantCount
      );

      if (menuPreferenceScore !== 0) {
        totalScore += menuPreferenceScore * 20 * config.menuPreference;
        reasons.push(
          menuPreferenceScore > 0
            ? "참여자 선호 메뉴"
            : "참여자 비선호 메뉴 반영"
        );
      }

      const categoryPreferenceScore = average(
        categoryPreferenceMap.get(categoryId) ?? [],
        participantCount
      );

      if (categoryPreferenceScore !== 0) {
        totalScore += categoryPreferenceScore * 20 * config.categoryPreference;
        reasons.push(
          categoryPreferenceScore > 0
            ? "참여자 선호 카테고리"
            : "참여자 비선호 카테고리 반영"
        );
      }

      const tagPreferenceScore = tagIds.reduce(
        (sum, tagId) =>
          sum + average(tagPreferenceMap.get(tagId) ?? [], participantCount),
        0
      );

      if (tagPreferenceScore !== 0) {
        totalScore += tagPreferenceScore * 20 * config.tagPreference;
        reasons.push(
          tagPreferenceScore > 0
            ? "참여자 선호 태그 포함"
            : "참여자 비선호 태그 반영"
        );
      }

      const ratingAverage = ratingMap.get(menuId);
      if (ratingAverage !== undefined) {
        totalScore += (ratingAverage - 3) * 10 * config.averageScore;
        reasons.push("참여자 과거 평점 반영");
      }

      const strongDislikeCount = countStrongDislikes(
        menuId,
        menuPreferenceMap,
        config.strongDislikeScore
      );

      if (strongDislikeCount > 0) {
        totalScore -= strongDislikeCount * config.strongDislikePenalty;
        reasons.push("강한 비선호 패널티");
      }

      return {
        rankNo: 0,
        menuId,
        menuName: menu.name,
        totalScore: roundScore(totalScore),
        reason: reasons.join(", ")
      };
    })
    .filter((result): result is MeetingRecommendationResult => {
      return result !== null && result.totalScore >= config.minimumScore;
    })
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.menuId - b.menuId;
    })
    .slice(0, config.resultLimit)
    .map((result, index) => ({
      ...result,
      rankNo: index + 1
    }));
}

function groupByMenu<T extends { menu_id: number }>(
  rows: T[],
  valueKey: keyof T
): Map<number, number[]> {
  const map = new Map<number, number[]>();

  for (const row of rows) {
    const menuId = Number(row.menu_id);
    const value = Number(row[valueKey]);

    if (!map.has(menuId)) {
      map.set(menuId, []);
    }

    map.get(menuId)!.push(value);
  }

  return map;
}

function groupPreference<T extends { preference_score: number }>(
  rows: T[],
  targetKey: keyof T
): Map<number, number[]> {
  const map = new Map<number, number[]>();

  for (const row of rows) {
    const targetId = Number(row[targetKey]);
    const score = Number(row.preference_score);

    if (!map.has(targetId)) {
      map.set(targetId, []);
    }

    map.get(targetId)!.push(score);
  }

  return map;
}

function groupRatings(
  rows: MeetingRecommendationBase["mealHistory"]
): Map<number, number> {
  const map = new Map<number, { total: number; count: number }>();

  for (const row of rows) {
    if (row.rating === null || row.rating === undefined) continue;

    const menuId = Number(row.menu_id);
    const current = map.get(menuId) ?? { total: 0, count: 0 };

    map.set(menuId, {
      total: current.total + Number(row.rating),
      count: current.count + 1
    });
  }

  return new Map(
    Array.from(map.entries()).map(([menuId, value]) => [
      menuId,
      value.total / value.count
    ])
  );
}

function hasAllergy(
  menuId: number,
  menuAllergiesMap: Map<number, number[]>,
  allergySet: Set<number>
) {
  return (menuAllergiesMap.get(Number(menuId)) ?? []).some((allergyId) =>
    allergySet.has(allergyId)
  );
}

function getRecentMenuSet(
  rows: MeetingRecommendationBase["mealHistory"],
  days: number
): Set<number> {
  if (days <= 0) return new Set<number>();

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return new Set(
    rows
      .filter((row) => new Date(row.eaten_at).getTime() >= cutoff)
      .map((row) => Number(row.menu_id))
  );
}

function average(values: number[], participantCount: number) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / participantCount;
}

function countStrongDislikes(
  menuId: number,
  menuPreferenceMap: Map<number, number[]>,
  strongDislikeScore: number
) {
  return (menuPreferenceMap.get(menuId) ?? []).filter(
    (score) => score <= strongDislikeScore
  ).length;
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
