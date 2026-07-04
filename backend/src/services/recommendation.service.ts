import type { RecommendationResult } from "../types/recommendation.js";

export function rankPersonalMenus(): RecommendationResult[] {
  // TODO: apply content-based weighted ranking from dbschema.md.
  return [];
}

export function rankMeetingMenus(): RecommendationResult[] {
  // TODO: aggregate joined participant preferences and restrictions.
  return [];
}
