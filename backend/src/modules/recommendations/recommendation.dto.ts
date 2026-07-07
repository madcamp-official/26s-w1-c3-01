export type PersonalRecommendationRequest = {
  meetingPurposeId?: number;
  recentDuplicateDays?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};

export type RecommendationScoreBreakdown = {
  category_score: number;
  tag_score: number;
  menu_preference_score: number;
  budget_score: number;
  new_menu_score: number;
  history_penalty: number;
};

export type RecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  categoryName: string | null;
  priceLevel: number | null;
  totalScore: number;
  reason: string;
  reasonTags: string[];
  isNewSuggestion: boolean;
  scores: RecommendationScoreBreakdown;
};

export type PersonalRecommendationResponse = {
  userId: number;
  runId: number;
  algorithmVersion: "personal-simple-v2";
  results: RecommendationResult[];
};

export type MenuRecommendationFeatureRow = {
  menu_id: number;
  category_id: number;
  category_name: string | null;
  name: string;
  price_level: number | null;
  tag_ids: number[] | string | null;
  allergy_ids: number[] | string | null;
};

export type UserMenuPreferenceRow = {
  menu_id: number;
  preference_score: number;
};

export type UserCategoryPreferenceRow = {
  category_id: number;
  preference_score: number;
};

export type UserTagPreferenceRow = {
  tag_id: number;
  preference_score: number;
};

export type MealHistoryRow = {
  menu_id: number;
  eaten_at: string;
  rating: number | null;
};

export type UserPreferenceRow = {
  budget_min: number | null;
  budget_max: number | null;
};

export type RecommendationBaseData = {
  menus: MenuRecommendationFeatureRow[];
  userMenuPreferences: UserMenuPreferenceRow[];
  userCategoryPreferences: UserCategoryPreferenceRow[];
  userTagPreferences: UserTagPreferenceRow[];
  userAllergyIds: number[];
  mealHistory: MealHistoryRow[];
  userPreference: UserPreferenceRow | null;
};
