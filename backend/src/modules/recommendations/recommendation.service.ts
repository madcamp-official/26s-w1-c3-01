import { rankPersonalMenus } from "./recommendation.algorithm.js";
import type { PersonalRecommendationRequest } from "./recommendation.dto.js";

export const recommendationService = {
  async createPersonalRecommendation(userId: number, input: PersonalRecommendationRequest) {
    return { userId, results: rankPersonalMenus(input) };
  }
};
