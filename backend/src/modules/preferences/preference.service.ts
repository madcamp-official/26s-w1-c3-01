import { preferenceRepository } from "./preference.repository.js";
import type { ReplacePreferenceRequest } from "./preference.dto.js";

export const preferenceService = {
  getMyPreferences(userId: number) {
    return preferenceRepository.findByUserId(userId);
  },

  replaceMyPreferences(userId: number, input: ReplacePreferenceRequest) {
    return preferenceRepository.replaceByUserId(userId, input);
  }
};
