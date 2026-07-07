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
    price_level: number | null;
    tag_ids: number[] | string | null;
    allergy_ids: number[] | string | null;
  }>;
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
  userPreferences: Array<{
    user_id: number;
    budget_min: number | null;
    budget_max: number | null;
  }>;
};

const DEFAULT_CONFIG: MeetingRecommendationConfig = {
  resultLimit: 3
};

export function createMeetingRecommendationConfig(
  input: MeetingRecommendationRequest
): MeetingRecommendationConfig {
  return {
    ...DEFAULT_CONFIG,
    resultLimit: input.resultLimit ?? input.limit ?? DEFAULT_CONFIG.resultLimit,
    participantUserIds: input.participantUserIds,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax
  };
}

export function rankMeetingMenus(
  base: MeetingRecommendationBase,
  config: MeetingRecommendationConfig
): MeetingRecommendationResult[] {
  const participantUserIds = base.participants
    .map((participant) => participant.user_id)
    .filter((userId): userId is number => userId !== null);

  const purposeScoreMap = new Map(
    base.purposeSuitability.map((row) => [
      Number(row.menu_id),
      Number(row.suitability_score)
    ])
  );

  const participantProfiles = participantUserIds.map((userId) => ({
    userId,
    allergyIds: new Set(
      base.userAllergies
        .filter((row) => Number(row.user_id) === userId)
        .map((row) => Number(row.allergy_id))
    ),
    menuPreferences: preferenceMapForUser(base.userMenuPreferences, userId, "menu_id"),
    categoryPreferences: preferenceMapForUser(base.userCategoryPreferences, userId, "category_id"),
    tagPreferences: preferenceMapForUser(base.userTagPreferences, userId, "tag_id"),
    ratings: ratingMapForUser(base.mealHistory, userId),
    budget: base.userPreferences.find((row) => Number(row.user_id) === userId) ?? null
  }));

  return base.menus
    .map((menu): MeetingRecommendationResult | null => {
      const menuId = Number(menu.menu_id);
      const categoryId = Number(menu.category_id);
      const tagIds = normalizeIdArray(menu.tag_ids);
      const allergyIds = normalizeIdArray(menu.allergy_ids);

      if (participantProfiles.some((participant) => allergyIds.some((allergyId) => participant.allergyIds.has(allergyId)))) {
        return null;
      }

      if (participantProfiles.some((participant) => participant.categoryPreferences.get(categoryId) === 0)) {
        return null;
      }

      if (participantProfiles.some((participant) => participant.menuPreferences.get(menuId) === 0)) {
        return null;
      }

      const participantScores = participantProfiles.map((participant) => {
        const categoryPreference = participant.categoryPreferences.get(categoryId) ?? 0;
        const tagPreference = averagePreferences(tagIds, participant.tagPreferences);
        const menuPreference = participant.menuPreferences.get(menuId) ?? participant.ratings.get(menuId) ?? 5;
        const budgetMin = config.budgetMin !== undefined ? config.budgetMin : participant.budget?.budget_min ?? null;
        const budgetMax = config.budgetMax !== undefined ? config.budgetMax : participant.budget?.budget_max ?? null;
        const budgetScore = calculateBudgetScore(
          menu.price_level,
          budgetMin,
          budgetMax
        );

        const rawScore =
          calculateCategoryScore(categoryPreference) +
          calculateTagScore(tagPreference) +
          calculateMenuPreferenceScore(menuPreference) +
          budgetScore;

        return roundScore(rawScore / 85 * 80);
      });

      const groupPreferenceScore = average(participantScores);
      const minimumParticipantScore = participantScores.length > 0 ? Math.min(...participantScores) : 0;
      const purposeScore = calculatePurposeScore(purposeScoreMap.get(menuId) ?? 0);
      const totalScore = roundScore(clamp(groupPreferenceScore + purposeScore, 0, 100));
      const reasons = getReasonTags(groupPreferenceScore, minimumParticipantScore, purposeScore);

      return {
        rankNo: 0,
        menuId,
        menuName: menu.name,
        totalScore,
        reason: reasons.length ? reasons.join(", ") : "참여자 선호도와 모임 목적을 기준으로 추천한 메뉴",
        scores: {
          group_preference_score: groupPreferenceScore,
          minimum_participant_score: minimumParticipantScore,
          purpose_score: purposeScore
        }
      };
    })
    .filter((result): result is MeetingRecommendationResult => result !== null)
    .sort(compareMeetingResults)
    .slice(0, config.resultLimit)
    .map((result, index) => ({
      ...result,
      rankNo: index + 1
    }));
}

function preferenceMapForUser<T extends { user_id: number; preference_score: number }>(
  rows: T[],
  userId: number,
  targetKey: keyof T
) {
  return new Map<number, number>(
    rows
      .filter((row) => Number(row.user_id) === userId)
      .map((row) => [Number(row[targetKey]), Number(row.preference_score)])
  );
}

function ratingMapForUser(rows: MeetingRecommendationBase["mealHistory"], userId: number) {
  const map = new Map<number, { total: number; count: number }>();

  for (const row of rows) {
    if (Number(row.user_id) !== userId || row.rating === null || row.rating === undefined) continue;

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
    .map((id) => preferenceMap.get(id))
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) return 0;
  return average(values);
}

function calculateCategoryScore(preferenceScore: number) {
  return roundScore(clamp(preferenceScore, 0, 5) / 5 * 30);
}

function calculateTagScore(tagAverage: number) {
  return roundScore(clamp(tagAverage, 0, 5) / 5 * 20);
}

function calculateMenuPreferenceScore(menuPreference: number) {
  return roundScore(clamp(menuPreference, 0, 5) / 5 * 25);
}

function calculateBudgetScore(
  priceLevel: number | null,
  budgetMin: number | null,
  budgetMax: number | null
) {
  if (priceLevel === null || budgetMax === null) return 10;
  if (priceLevel > budgetMax) return 5;
  if (budgetMin !== null && priceLevel < budgetMin) return 8;
  return 10;
}

function calculatePurposeScore(purposeSuitability: number) {
  return roundScore(clamp(purposeSuitability, 0, 5) / 5 * 20);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function compareMeetingResults(a: MeetingRecommendationResult, b: MeetingRecommendationResult) {
  return (
    b.totalScore - a.totalScore ||
    b.scores.minimum_participant_score - a.scores.minimum_participant_score ||
    b.scores.purpose_score - a.scores.purpose_score ||
    b.scores.group_preference_score - a.scores.group_preference_score ||
    a.menuName.localeCompare(b.menuName, "ko") ||
    a.menuId - b.menuId
  );
}

function getReasonTags(groupPreferenceScore: number, minimumParticipantScore: number, purposeScore: number) {
  const reasons: string[] = [];

  if (purposeScore >= 16) reasons.push("모임 목적에 잘 맞는 메뉴");
  if (groupPreferenceScore >= 60) reasons.push("참여자 평균 선호도가 높은 메뉴");
  if (minimumParticipantScore >= 50) reasons.push("참여자 간 선호도 차이가 적은 메뉴");

  return reasons;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundScore(score: number) {
  return Math.round(score * 100) / 100;
}
