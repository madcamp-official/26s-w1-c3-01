export type PreferenceScoreInput = {
  preferenceScore: number;
};

export type ReplacePreferenceRequest = {
  menuPreferences?: Array<PreferenceScoreInput & { menuId: number }>;
  categoryPreferences?: Array<PreferenceScoreInput & { categoryId: number }>;
  tagPreferences?: Array<PreferenceScoreInput & { tagId: number }>;
  allergyIds?: number[];
};
