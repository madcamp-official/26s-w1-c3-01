export type CreateMeetingRequest = {
  title?: string;
  meetingTime: string;
  meetingPurposeId: number;
  location?: string;
};

export type AddMeetingParticipantRequest = {
  userId: number;
  displayName?: string;
};

export type JoinMeetingRequest = {
  displayName: string;
};
