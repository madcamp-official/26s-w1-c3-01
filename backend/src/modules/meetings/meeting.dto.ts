export type CreateMeetingRequest = {
  title?: string;
  meetingTime: string;
  meetingPurposeId: number;
  location?: string;
};
