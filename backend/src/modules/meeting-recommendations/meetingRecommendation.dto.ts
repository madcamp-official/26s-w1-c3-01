export type MeetingRecommendationRequest = {
  resultLimit?: number;
  limit?: number;
  participantUserIds?: number[];
  budgetMin?: number | null;
  budgetMax?: number | null;
};

export type MeetingRecommendationScoreBreakdown = {
  category_score?: number;
  tag_score?: number;
  menu_preference_score?: number;
  budget_score?: number;
  group_preference_score?: number;
  minimum_participant_score?: number;
  purpose_score?: number;
};

export type MeetingRecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  reason: string;
  scores: MeetingRecommendationScoreBreakdown;
};

export type MeetingRecommendationConfig = {
  resultLimit: number;
  participantUserIds?: number[];
  budgetMin?: number | null;
  budgetMax?: number | null;
};
