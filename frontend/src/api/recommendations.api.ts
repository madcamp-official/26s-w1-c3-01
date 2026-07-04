import { apiRequest } from "./client";
import type { PersonalRecommendationRequest } from "../features/recommendations/recommendation.types";

export const recommendationsApi = {
  createPersonal(body: PersonalRecommendationRequest) {
    return apiRequest("/recommendations/personal", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }
};
