import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().optional(),
  meetingTime: z.string().datetime(),
  meetingPurposeId: z.number().int().positive(),
  location: z.string().optional(),
  participantUserIds: z.array(z.coerce.number().int().positive()).optional()
});

export const updateMeetingSchema = createMeetingSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "수정할 모임 정보를 입력해주세요."
  });

export const addMeetingParticipantSchema = z.object({
  userId: z.number().int().positive(),
  displayName: z.string().trim().min(1).max(50).optional()
});

export const joinMeetingSchema = z.object({
  displayName: z.string().trim().min(1).max(50)
});
