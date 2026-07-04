import { supabaseAdmin } from "../../config/supabase.js";
import type {
  AddMeetingParticipantRequest,
  CreateMeetingRequest,
  MeetingListQuery,
  UpdateMeetingParticipantRequest,
  UpdateMeetingRequest
} from "./meeting.dto.js";

const meetingSelect = `
  meeting_id,
  title,
  meeting_time,
  meeting_purpose_id,
  location,
  created_by,
  selected_menu_id,
  status,
  created_at,
  meeting_purposes(meeting_purpose_id, name),
  menus(menu_id, name, description),
  users(user_id, nickname)
`;

const participantSelect = `
  participant_id,
  meeting_id,
  user_id,
  display_name,
  attendance_status,
  joined_at,
  created_at,
  users(user_id, nickname, email)
`;

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
        status: "CREATED"
      })
      .select(meetingSelect)
      .single();

    if (error) throw error;
    return data;
  },

  async listByCreator(userId: number, query: MeetingListQuery = {}) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    let request = supabaseAdmin
      .from("meetings")
      .select(meetingSelect, { count: "exact" })
      .eq("created_by", userId)
      .order("meeting_time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.status) {
      request = request.eq("status", query.status);
    }

    const { data, error, count } = await request;

    if (error) throw error;

    return {
      items: data ?? [],
      pagination: {
        limit,
        offset,
        total: count ?? 0
      }
    };
  },

  async findById(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .select(meetingSelect)
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async update(meetingId: number, input: UpdateMeetingRequest) {
    // undefined는 수정하지 않고, null은 DB에 null로 반영합니다.
    const patch = {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.meetingTime !== undefined && { meeting_time: input.meetingTime }),
      ...(input.meetingPurposeId !== undefined && { meeting_purpose_id: input.meetingPurposeId }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.selectedMenuId !== undefined && { selected_menu_id: input.selectedMenuId }),
      ...(input.status !== undefined && { status: input.status })
    };

    const { data, error } = await supabaseAdmin
      .from("meetings")
      .update(patch)
      .eq("meeting_id", meetingId)
      .select(meetingSelect)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async delete(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .delete()
      .eq("meeting_id", meetingId)
      .select("meeting_id")
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createHostParticipant(meetingId: number, userId: number, displayName: string) {
    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .upsert(
        {
          meeting_id: meetingId,
          user_id: userId,
          display_name: displayName,
          attendance_status: "JOINED",
          joined_at: new Date().toISOString()
        },
        { onConflict: "meeting_id,user_id" }
      )
      .select(participantSelect)
      .single();

    if (error) throw error;
    return data;
  },

  async listParticipants(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .select(participantSelect)
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async addParticipant(meetingId: number, input: AddMeetingParticipantRequest) {
    const attendanceStatus = input.attendanceStatus ?? "PENDING";

    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .insert({
        meeting_id: meetingId,
        user_id: input.userId ?? null,
        display_name: input.displayName,
        attendance_status: attendanceStatus,
        joined_at: attendanceStatus === "JOINED" ? new Date().toISOString() : null
      })
      .select(participantSelect)
      .single();

    if (error) throw error;
    return data;
  },

  async updateParticipant(participantId: number, input: UpdateMeetingParticipantRequest) {
    const patch = {
      ...(input.displayName !== undefined && { display_name: input.displayName }),
      ...(input.attendanceStatus !== undefined && {
        attendance_status: input.attendanceStatus,
        joined_at: input.attendanceStatus === "JOINED" ? new Date().toISOString() : null
      })
    };

    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .update(patch)
      .eq("participant_id", participantId)
      .select(participantSelect)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};