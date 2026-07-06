export type CreateMeetingRequest = {
  title?: string;
  meetingTime: string;
  meetingPurposeId: number;
  location?: string;
  participantUserIds?: number[];
};

export type UpdateMeetingRequest = Partial<CreateMeetingRequest>;

export type MeetingSummary = {
  meeting_id: number;
  title: string | null;
  meeting_time: string;
  meeting_purpose_id: number;
  location: string | null;
  selected_menu_id: number | null;
  status: string;
};

export type MeetingRecommendationResult = {
  rankNo: number;
  menuId: number;
  menuName: string;
  totalScore: number;
  reason: string;
};
