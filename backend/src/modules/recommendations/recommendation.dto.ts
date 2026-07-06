export type PersonalRecommendationRequest = {
  recentDuplicateDays?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};

export type RecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  categoryName?: string;
  reason: string;
  isNewSuggestion?: boolean;
};
