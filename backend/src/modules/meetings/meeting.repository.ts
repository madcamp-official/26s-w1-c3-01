import { supabaseAdmin } from "../../config/supabase.js";
import type { CreateMeetingRequest } from "./meeting.dto.js";

export const meetingRepository = {
  async create(userId: number, input: CreateMeetingRequest) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .insert({
        title: input.title ?? null,
        meeting_time: input.meetingTime,
        meeting_purpose_id: input.meetingPurposeId,
        location: input.location ?? null,
        created_by: userId,
        status: "OPEN"
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
};
