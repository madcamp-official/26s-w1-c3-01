import { describe, expect, it } from "vitest";
import {
  calculateCategoryScore,
  calculateNoveltyScore,
  calculatePersonalRecommendationScore,
  calculatePopularityScore,
  calculatePriceScore,
  calculateRatingScore,
  calculateRepeatScore,
  calculateReviewConfidenceScore
} from "../modules/recommendations/recommendation.algorithm.js";
import type { MenuRow } from "../modules/recommendations/recommendation.dto.js";

const sampleMenu: MenuRow = {
  menu_id: 1,
  category_id: 1,
  name: "김치찌개",
  description: null,
  spicy_level: 2,
  price_level: 3,
  calorie: null
};

describe("personal recommendation scoring", () => {
  it("calculates category score from current -5 to 5 DB preference range", () => {
    expect(calculateCategoryScore(-5)).toBe(0);
    expect(calculateCategoryScore(0)).toBe(10);
    expect(calculateCategoryScore(5)).toBe(20);
  });

  it("calculates nonlinear rating score", () => {
    expect(calculateRatingScore(1)).toBe(0);
    expect(calculateRatingScore(5)).toBe(20);
  });

  it("increases review confidence with review count without exceeding 10", () => {
    const low = calculateReviewConfidenceScore(1);
    const high = calculateReviewConfidenceScore(100);

    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(10);
  });

  it("gives max price score inside budget range", () => {
    expect(calculatePriceScore(3, 2, 4)).toBe(15);
  });

  it("penalizes price level above budget max", () => {
    expect(calculatePriceScore(5, 1, 3)).toBeLessThan(15);
  });

  it("gives max popularity score for the most popular menu", () => {
    expect(calculatePopularityScore(10, 10)).toBe(15);
  });

  it("gives full novelty score for never-picked menus", () => {
    expect(calculateNoveltyScore(0)).toBe(10);
  });

  it("lowers repeat score as recent picks increase", () => {
    expect(calculateRepeatScore(3)).toBeLessThan(calculateRepeatScore(0));
  });

  it("drops negative feedback score to zero for recent dislikes", () => {
    const result = calculatePersonalRecommendationScore(sampleMenu, {
      categoryPreferenceScore: 0,
      ratingAverage: 3.8,
      reviewCount: 0,
      priceLevel: 3,
      budgetMin: null,
      budgetMax: null,
      popularityRaw: 0,
      maxPopularityRaw: 0,
      userPickCount: 0,
      recentPickCount7d: 0,
      hasRecentDislike30d: true
    });

    expect(result.scores.negative_feedback_score).toBe(0);
  });

  it("clamps total score to the 0 to 100 range", () => {
    const result = calculatePersonalRecommendationScore(sampleMenu, {
      categoryPreferenceScore: 5,
      ratingAverage: 5,
      reviewCount: 999,
      priceLevel: 2,
      budgetMin: 1,
      budgetMax: 3,
      popularityRaw: 999,
      maxPopularityRaw: 999,
      userPickCount: 0,
      recentPickCount7d: 0,
      hasRecentDislike30d: false
    });

    expect(result.total_score).toBeGreaterThanOrEqual(0);
    expect(result.total_score).toBeLessThanOrEqual(100);
  });

  it("marks a menu as new when the user has never picked it", () => {
    const result = calculatePersonalRecommendationScore(sampleMenu, {
      categoryPreferenceScore: 0,
      ratingAverage: 3.8,
      reviewCount: 0,
      priceLevel: 3,
      budgetMin: null,
      budgetMax: null,
      popularityRaw: 0,
      maxPopularityRaw: 0,
      userPickCount: 0,
      recentPickCount7d: 0,
      hasRecentDislike30d: false
    });

    expect(result.is_new_suggestion).toBe(true);
  });
});
