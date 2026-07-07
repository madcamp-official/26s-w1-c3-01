import { describe, expect, it, vi } from "vitest";
import {
  calculateBudgetScore,
  calculateCategoryScore,
  calculateHistoryPenalty,
  calculateMenuPreferenceScore,
  calculatePersonalRecommendationScore,
  calculateTagScore
} from "../modules/recommendations/recommendation.algorithm.js";

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
});
