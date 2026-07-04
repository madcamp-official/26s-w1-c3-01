import type { PersonalRecommendationRequest, RecommendationResult } from "./recommendation.dto.js";

export function rankPersonalMenus(_input: PersonalRecommendationRequest): RecommendationResult[] {
  // TODO: implement weighted recommendation logic against Supabase DB data.
  return [];
}
