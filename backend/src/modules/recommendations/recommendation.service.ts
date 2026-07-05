import { rankPersonalMenus } from "./recommendation.algorithm.js";
import { recommendationRepository } from "./recommendation.repository.js";
import type { PersonalRecommendationRequest } from "./recommendation.dto.js";

export const recommendationService = {
  async createPersonalRecommendation(userId: number, input: PersonalRecommendationRequest) {
    const base = await recommendationRepository.loadRecommendationBase(userId);
    return { userId, results: rankPersonalMenus(input, base) };
  }
};
