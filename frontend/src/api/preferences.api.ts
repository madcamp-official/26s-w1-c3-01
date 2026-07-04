import { apiRequest } from "./client";
import type { ReplacePreferenceRequest } from "../features/preferences/preference.types";

export const preferencesApi = {
  getMine() {
    return apiRequest("/preferences/me");
  },
  replaceMine(body: ReplacePreferenceRequest) {
    return apiRequest("/preferences/me", {
      method: "PUT",
      body: JSON.stringify(body)
    });
  }
};
