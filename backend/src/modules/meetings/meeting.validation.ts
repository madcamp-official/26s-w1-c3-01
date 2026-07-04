import { z } from "zod";

export const meetingStatusSchema = z.enum([
  "CREATED",
  "COLLECTING",
  "RECOMMENDED",
  "DECIDED",
  "CLOSED"
]);

export const attendanceStatusSchema = z.enum([
  "JOINED",
  "PENDING",
  "DECLINED"
]);

export const createMeetingSchema = z.object({
  title: z.string().trim().max(100).optional(),
  // Supabase timestamptz에 저장할 ISO 날짜 문자열입니다.
  meetingTime: z.string().datetime({ offset: true }),
  meetingPurposeId: z.coerce.number().int().positive(),
  location: z.string().trim().max(255).optional()
});

export const updateMeetingSchema = z.object({
  title: z.string().trim().max(100).nullable().optional(),
  meetingTime: z.string().datetime({ offset: true }).optional(),
  meetingPurposeId: z.coerce.number().int().positive().optional(),
  location: z.string().trim().max(255).nullable().optional(),
  selectedMenuId: z.coerce.number().int().positive().nullable().optional(),
  status: meetingStatusSchema.optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "수정할 값을 최소 1개 이상 입력해야 합니다."
});

export const addMeetingParticipantSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  displayName: z.string().trim().min(1).max(50),
  attendanceStatus: attendanceStatusSchema.optional()
});

export const updateMeetingParticipantSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  attendanceStatus: attendanceStatusSchema.optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "수정할 값을 최소 1개 이상 입력해야 합니다."
});