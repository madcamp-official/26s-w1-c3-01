import type { PersonalRecommendationRequest, RecommendationResult } from "./recommendation.dto.js";

export function rankPersonalMenus(_input: PersonalRecommendationRequest): RecommendationResult[] {
  // TODO: port weighted recommendation logic from Supabase Edge Function.
  return [];
}
