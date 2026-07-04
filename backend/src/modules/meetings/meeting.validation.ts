import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().optional(),
  meetingTime: z.string(),
  meetingPurposeId: z.number(),
  location: z.string().optional()
});
