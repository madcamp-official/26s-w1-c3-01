import type { ReplacePreferenceRequest } from "./preference.dto.js";

export const preferenceRepository = {
  async findByUserId(_userId: number) {
    return { menuPreferences: [], categoryPreferences: [], tagPreferences: [], allergyIds: [] };
  },

  async replaceByUserId(_userId: number, _input: ReplacePreferenceRequest) {
    return { updated: true };
  }
};
