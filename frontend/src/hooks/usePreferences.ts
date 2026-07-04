import { preferencesApi } from "../api/preferences.api";

export function usePreferences() {
  return {
    getMyPreferences: preferencesApi.getMine,
    replaceMyPreferences: preferencesApi.replaceMine
  };
}
