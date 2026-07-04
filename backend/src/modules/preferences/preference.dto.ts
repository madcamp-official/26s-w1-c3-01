export type PreferenceScoreInput = {
  preferenceScore: number;
};

export type MenuPreferenceInput = PreferenceScoreInput & {
  menuId: number;
};

export type CategoryPreferenceInput = PreferenceScoreInput & {
  categoryId: number;
};

export type TagPreferenceInput = PreferenceScoreInput & {
  tagId: number;
};

export type ReplacePreferenceRequest = {
  menuPreferences?: MenuPreferenceInput[];
  categoryPreferences?: CategoryPreferenceInput[];
  tagPreferences?: TagPreferenceInput[];
  allergyIds?: number[];
};

export type MyPreferencesResponse = {
  menuPreferences: unknown[];
  categoryPreferences: unknown[];
  tagPreferences: unknown[];
  allergyIds: number[];
};