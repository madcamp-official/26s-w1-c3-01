import { rankPersonalMenus } from "./recommendation.algorithm.js";
import { recommendationRepository } from "./recommendation.repository.js";
import type {
  PersonalRecommendationRequest,
  PersonalRecommendationResponse
} from "./recommendation.dto.js";

export const recommendationService = {
  async createPersonalRecommendation(
    userId: number,
    input: PersonalRecommendationRequest
  ): Promise<PersonalRecommendationResponse> {
    const base = await recommendationRepository.loadRecommendationBase(userId);
    const results = rankPersonalMenus(input, base);
    const { runId } = await recommendationRepository.savePersonalRun(userId, results, input);

    return {
      userId,
      runId,
      results
    };
  }
};