export type PersonalRecommendationRequest = {
  meetingPurposeId?: number;
  recentDuplicateDays?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};

export type RecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  categoryName?: string | null;
  priceLevel?: number | null;
  totalScore: number;
  reason: string;
  reasonTags?: string[];
  isNewSuggestion?: boolean;
  scores?: {
    category_score?: number;
    tag_score?: number;
    menu_preference_score?: number;
    budget_score?: number;
    new_menu_score?: number;
    history_penalty?: number;
  };
};
