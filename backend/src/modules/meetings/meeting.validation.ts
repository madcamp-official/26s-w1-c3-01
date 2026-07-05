import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().optional(),
  meetingTime: z.string().datetime(),
  meetingPurposeId: z.number().int().positive(),
  location: z.string().optional()
});

export const addMeetingParticipantSchema = z.object({
  userId: z.number().int().positive(),
  displayName: z.string().trim().min(1).max(50).optional()
});

export const joinMeetingSchema = z.object({
  displayName: z.string().trim().min(1).max(50)
});
