export type RecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  reason: string;
  isNewSuggestion?: boolean;
};
