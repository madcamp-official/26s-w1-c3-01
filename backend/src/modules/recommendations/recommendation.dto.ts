export type PersonalRecommendationRequest = {
  meetingPurposeId?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};

export type RecommendationScoreBreakdown = {
  category_score: number;
  rating_score: number;
  review_confidence_score: number;
  price_score: number;
  popularity_score: number;
  novelty_score: number;
  repeat_score: number;
  negative_feedback_score: number;
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
  algorithmVersion: "personal-weighted-v1";
  results: RecommendationResult[];
};

export type MenuRow = {
  menu_id: number;
  category_id: number;
  name: string;
  price_level: number | null;
  menu_categories?:
    | {
        category_id: number;
        name: string;
      }
    | Array<{
        category_id: number;
        name: string;
      }>
    | null;
};

export type PreferenceRow = {
  preference_score: number;
};

export type UserCategoryPreferenceRow = PreferenceRow & {
  category_id: number;
};

export type MenuAllergyRow = {
  menu_id: number;
  allergy_id: number;
};

export type UserAllergyRow = {
  allergy_id: number;
};

export type MealHistoryRow = {
  menu_id: number;
  eaten_at: string;
};

export type ReviewRow = {
  menu_id: number;
  rating: number;
};

export type RatingStatsRow = {
  menu_id: number;
  rating_average: number;
  rating_count: number;
};

export type PopularityStatsRow = {
  menu_id: number;
  popularity_raw: number;
};

export type UserPreferenceRow = {
  budget_min: number | null;
  budget_max: number | null;
};

export type UserMenuInteractionType = "view" | "like" | "pick" | "dislike" | "bookmark";

export type UserMenuInteractionRow = {
  menu_id: number;
  interaction_type: UserMenuInteractionType;
  created_at: string;
};

export type RecommendationBaseData = {
  menus: MenuRow[];
  menuAllergies: MenuAllergyRow[];
  userCategoryPreferences: UserCategoryPreferenceRow[];
  userAllergies: UserAllergyRow[];
  mealHistory: MealHistoryRow[];
  ratingStats: RatingStatsRow[];
  userPreference: UserPreferenceRow | null;
  userMenuInteractions: UserMenuInteractionRow[];
  popularityStats: PopularityStatsRow[];
};
