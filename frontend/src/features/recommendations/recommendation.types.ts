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
