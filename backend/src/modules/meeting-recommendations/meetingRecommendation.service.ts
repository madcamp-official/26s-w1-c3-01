import { rankMeetingMenus } from "./meetingRecommendation.algorithm.js";

export const meetingRecommendationService = {
  async create(meetingId: number, input: unknown) {
    return { meetingId, results: rankMeetingMenus(input) };
  }
};
