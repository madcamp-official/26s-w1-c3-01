export type MeetingRecommendationRequest = {
  resultLimit?: number;
  limit?: number;
  recentDuplicateDays?: number;
  excludeRecentDays?: number;
  participantUserIds?: number[];
};

export type MeetingRecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  reason: string;
};

export type MeetingRecommendationConfig = {
  menuPreference: number;
  categoryPreference: number;
  tagPreference: number;
  averageScore: number;
  minimumScore: number;
  strongDislikePenalty: number;
  strongDislikeScore: number;
  recentDuplicateDays: number;
  resultLimit: number;
  participantUserIds?: number[];
};
