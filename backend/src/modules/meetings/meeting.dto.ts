export type MeetingStatus = "CREATED" | "COLLECTING" | "RECOMMENDED" | "DECIDED" | "CLOSED";

export type AttendanceStatus = "JOINED" | "PENDING" | "DECLINED";

export type CreateMeetingRequest = {
  title?: string;
  meetingTime: string;
  meetingPurposeId: number;
  location?: string;
};

export type UpdateMeetingRequest = {
  title?: string | null;
  meetingTime?: string;
  meetingPurposeId?: number;
  location?: string | null;
  selectedMenuId?: number | null;
  status?: MeetingStatus;
};

export type MeetingListQuery = {
  limit?: number;
  offset?: number;
  status?: MeetingStatus;
};

export type AddMeetingParticipantRequest = {
  userId?: number;
  displayName: string;
  attendanceStatus?: AttendanceStatus;
};

export type UpdateMeetingParticipantRequest = {
  displayName?: string;
  attendanceStatus?: AttendanceStatus;
};