import { meetingsApi } from "../api/meetings.api";

export function useMeetings() {
  return {
    listMeetings: meetingsApi.list,
    createMeeting: meetingsApi.create,
    getMeeting: meetingsApi.get
  };
}
