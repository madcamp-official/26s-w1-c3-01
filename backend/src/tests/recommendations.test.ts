import { describe, expect, it, vi } from "vitest";
import {
  calculateBudgetScore,
  calculateCategoryScore,
  calculateHistoryPenalty,
  calculateMenuPreferenceScore,
  calculatePersonalRecommendationScore,
  calculateTagScore,
  rankPersonalMenus
} from "../modules/recommendations/recommendation.algorithm.js";
import type { RecommendationBaseData } from "../modules/recommendations/recommendation.dto.js";
import { rankMeetingMenus } from "../modules/meeting-recommendations/meetingRecommendation.algorithm.js";

describe("personal recommendation scoring", () => {
  it("maps category preference 0 to 5 into 0 to 30 points", () => {
    expect(calculateCategoryScore(0)).toBe(0);
    expect(calculateCategoryScore(5)).toBe(30);
  });

  it("maps tag preference average 4 into 16 points", () => {
    expect(calculateTagScore(4)).toBe(16);
  });

  it("maps menu preference 5 into 25 points", () => {
    expect(calculateMenuPreferenceScore(5)).toBe(25);
  });

  it("scores budget fit with fixed buckets", () => {
    expect(calculateBudgetScore(3, 2, 4)).toBe(10);
    expect(calculateBudgetScore(1, 2, 4)).toBe(8);
    expect(calculateBudgetScore(5, 2, 4)).toBe(5);
    expect(calculateBudgetScore(3, null, null)).toBe(10);
  });

  it("calculates linear history penalty inside recent duplicate days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T00:00:00.000Z"));

    expect(calculateHistoryPenalty("2026-07-07T00:00:00.000Z", 7)).toBe(20);
    expect(calculateHistoryPenalty("2026-07-04T00:00:00.000Z", 7)).toBe(11.43);
    expect(calculateHistoryPenalty("2026-06-30T00:00:00.000Z", 7)).toBe(0);
    expect(calculateHistoryPenalty("2026-07-07T00:00:00.000Z", 0)).toBe(0);

    vi.useRealTimers();
  });

  it("combines simple recommendation scores and clamps to 100", () => {
    const result = calculatePersonalRecommendationScore({
      categoryPreference: 5,
      tagPreferenceAverage: 5,
      menuPreference: 5,
      priceLevel: 2,
      budgetMin: 1,
      budgetMax: 3,
      isNewMenu: true,
      lastEatenAt: null,
      recentDuplicateDays: 7
    });

    expect(result.total_score).toBe(100);
    expect(result.scores).toEqual({
      category_score: 30,
      tag_score: 20,
      menu_preference_score: 25,
      budget_score: 10,
      new_menu_score: 15,
      history_penalty: 0
    });
  });

  it("subtracts history penalty from final score", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T00:00:00.000Z"));

    const result = calculatePersonalRecommendationScore({
      categoryPreference: 0,
      tagPreferenceAverage: 0,
      menuPreference: 5,
      priceLevel: 2,
      budgetMin: 1,
      budgetMax: 3,
      isNewMenu: false,
      lastEatenAt: "2026-07-07T00:00:00.000Z",
      recentDuplicateDays: 7
    });

    expect(result.total_score).toBe(15);
    expect(result.scores.history_penalty).toBe(20);

    vi.useRealTimers();
  });

  it("excludes new menus when includeNewMenu is false", () => {
    const results = rankPersonalMenus(
      { includeNewMenu: false, limit: 5 },
      {
        ...personalBaseData(),
        mealHistory: [
          {
            menu_id: 1,
            eaten_at: "2026-07-01T00:00:00.000Z",
            rating: 4
          }
        ]
      }
    );

    expect(results.map((item) => item.menuId)).toEqual([1]);
  });

  it("uses meal history rating average when direct menu preference is missing", () => {
    const [result] = rankPersonalMenus(
      { includeNewMenu: true, limit: 1 },
      {
        ...personalBaseData(),
        menus: [
          {
            menu_id: 1,
            category_id: 1,
            category_name: "한식",
            name: "김치찌개",
            price_level: 3,
            tag_ids: [],
            allergy_ids: []
          }
        ],
        mealHistory: [
          { menu_id: 1, eaten_at: "2026-07-01T00:00:00.000Z", rating: 3 },
          { menu_id: 1, eaten_at: "2026-07-02T00:00:00.000Z", rating: 5 }
        ]
      }
    );

    expect(result.scores.menu_preference_score).toBe(20);
  });
});

describe("meeting recommendation scoring", () => {
  it("excludes menus when any participant has an allergy conflict", () => {
    const results = rankMeetingMenus(
      {
        ...meetingBaseData(),
        menus: [
          { menu_id: 1, category_id: 1, name: "김치찌개", price_level: 3, tag_ids: [], allergy_ids: [10] },
          { menu_id: 2, category_id: 1, name: "비빔밥", price_level: 3, tag_ids: [], allergy_ids: [] }
        ],
        userAllergies: [{ user_id: 1, allergy_id: 10 }]
      },
      { resultLimit: 5 }
    );

    expect(results.map((item) => item.menuId)).toEqual([2]);
  });

  it("excludes menus with explicit category or menu zero preference", () => {
    const results = rankMeetingMenus(
      {
        ...meetingBaseData(),
        menus: [
          { menu_id: 1, category_id: 1, name: "김치찌개", price_level: 3, tag_ids: [], allergy_ids: [] },
          { menu_id: 2, category_id: 2, name: "초밥", price_level: 3, tag_ids: [], allergy_ids: [] },
          { menu_id: 3, category_id: 3, name: "파스타", price_level: 3, tag_ids: [], allergy_ids: [] }
        ],
        userCategoryPreferences: [{ user_id: 1, category_id: 2, preference_score: 0 }],
        userMenuPreferences: [{ user_id: 2, menu_id: 3, preference_score: 0 }]
      },
      { resultLimit: 5 }
    );

    expect(results.map((item) => item.menuId)).toEqual([1]);
  });

  it("uses purpose score and minimum participant score as tie breakers", () => {
    const results = rankMeetingMenus(
      {
        ...meetingBaseData(),
        menus: [
          { menu_id: 1, category_id: 1, name: "갈비탕", price_level: 3, tag_ids: [], allergy_ids: [] },
          { menu_id: 2, category_id: 2, name: "김밥", price_level: 3, tag_ids: [], allergy_ids: [] },
          { menu_id: 3, category_id: 3, name: "냉면", price_level: 3, tag_ids: [], allergy_ids: [] }
        ],
        purposeSuitability: [
          { menu_id: 1, meeting_purpose_id: 1, suitability_score: 4 },
          { menu_id: 2, meeting_purpose_id: 1, suitability_score: 4 },
          { menu_id: 3, meeting_purpose_id: 1, suitability_score: 5 }
        ],
        userCategoryPreferences: [
          { user_id: 1, category_id: 1, preference_score: 5 },
          { user_id: 2, category_id: 1, preference_score: 1 },
          { user_id: 1, category_id: 2, preference_score: 4 },
          { user_id: 2, category_id: 2, preference_score: 2 },
          { user_id: 1, category_id: 3, preference_score: 2 },
          { user_id: 2, category_id: 3, preference_score: 2 }
        ]
      },
      { resultLimit: 3 }
    );

    expect(results.map((item) => item.menuId)).toEqual([2, 1, 3]);
    expect(results[0].scores.minimum_participant_score).toBeGreaterThan(results[1].scores.minimum_participant_score);
    expect(results[2].scores.purpose_score).toBe(20);
  });
});

function personalBaseData(): RecommendationBaseData {
  return {
    menus: [
      {
        menu_id: 1,
        category_id: 1,
        category_name: "한식",
        name: "김치찌개",
        price_level: 3,
        tag_ids: [],
        allergy_ids: []
      },
      {
        menu_id: 2,
        category_id: 1,
        category_name: "한식",
        name: "비빔밥",
        price_level: 3,
        tag_ids: [],
        allergy_ids: []
      }
    ],
    userMenuPreferences: [],
    userCategoryPreferences: [{ category_id: 1, preference_score: 5 }],
    userTagPreferences: [],
    userAllergyIds: [],
    mealHistory: [],
    userPreference: { budget_min: 1, budget_max: 5 }
  };
}

function meetingBaseData() {
  return {
    participants: [{ user_id: 1 }, { user_id: 2 }],
    menus: [],
    purposeSuitability: [],
    userMenuPreferences: [],
    userCategoryPreferences: [],
    userTagPreferences: [],
    userAllergies: [],
    mealHistory: [],
    userPreferences: [
      { user_id: 1, budget_min: 1, budget_max: 5 },
      { user_id: 2, budget_min: 1, budget_max: 5 }
    ]
  };
}
