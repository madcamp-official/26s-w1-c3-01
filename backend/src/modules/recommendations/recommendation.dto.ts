export type PersonalRecommendationRequest = {
  meetingPurposeId?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};

export type RecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  reason: string;
  isNewSuggestion?: boolean;
};

export type MenuRow = {
  menu_id: number;
  category_id: number;
  name: string;
  description: string | null;
  spicy_level: number;
  price_level: number | null;
  calorie: number | null;
};

export type PreferenceRow = {
  preference_score: number;
};

export type UserMenuPreferenceRow = PreferenceRow & {
  menu_id: number;
};

export type UserCategoryPreferenceRow = PreferenceRow & {
  category_id: number;
};

export type UserTagPreferenceRow = PreferenceRow & {
  tag_id: number;
};

export type MenuTagRow = {
  menu_id: number;
  tag_id: number;
};

export type MenuAllergyRow = {
  menu_id: number;
  allergy_id: number;
};

export type UserAllergyRow = {
  allergy_id: number;
};

export type PurposeSuitabilityRow = {
  menu_id: number;
  meeting_purpose_id: number;
  suitability_score: number;
};

export type MealHistoryRow = {
  menu_id: number;
  rating: number | null;
  eaten_at: string;
};

export type RecommendationBaseData = {
  menus: MenuRow[];
  menuTags: MenuTagRow[];
  menuAllergies: MenuAllergyRow[];
  purposeSuitability: PurposeSuitabilityRow[];
  userMenuPreferences: UserMenuPreferenceRow[];
  userCategoryPreferences: UserCategoryPreferenceRow[];
  userTagPreferences: UserTagPreferenceRow[];
  userAllergies: UserAllergyRow[];
  mealHistory: MealHistoryRow[];
};