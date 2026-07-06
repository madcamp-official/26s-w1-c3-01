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
    rating_score?: number;
    review_confidence_score?: number;
    price_score?: number;
    popularity_score?: number;
    novelty_score?: number;
    repeat_score?: number;
    negative_feedback_score?: number;
  };
};
