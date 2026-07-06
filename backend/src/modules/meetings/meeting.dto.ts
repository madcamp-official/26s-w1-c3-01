export type CreateMeetingRequest = {
  title?: string;
  meetingTime: string;
  meetingPurposeId: number;
  location?: string;
  participantUserIds?: number[];
};

export type UpdateMeetingRequest = Partial<CreateMeetingRequest>;

export type AddMeetingParticipantRequest = {
  userId: number;
  displayName?: string;
};

export type JoinMeetingRequest = {
  displayName: string;
};
