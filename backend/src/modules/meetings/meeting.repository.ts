import { supabaseAdmin } from "../../config/supabase.js";
import type { AddMeetingParticipantRequest, CreateMeetingRequest, UpdateMeetingRequest } from "./meeting.dto.js";

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
  users!meetings_created_by_fkey(user_id, nickname),
  meeting_participants(participant_id, user_id, display_name, attendance_status)
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
      .select("meeting_id")
      .single();

    if (error) throw error;
    return this.findByIdForUser(Number(data.meeting_id), userId);
  },

  async listForUser(userId: number) {
    const { data: participantRows, error: participantError } = await supabaseAdmin
      .from("meeting_participants")
      .select("meeting_id")
      .eq("user_id", userId);

    if (participantError) throw participantError;
    const participantMeetingIds = (participantRows ?? []).map((row) => Number(row.meeting_id));
    const filters = [`created_by.eq.${userId}`];
    if (participantMeetingIds.length > 0) {
      filters.push(`meeting_id.in.(${participantMeetingIds.join(",")})`);
    }

    const { data, error } = await supabaseAdmin
      .from("meetings")
      .select(meetingSelect)
      .or(filters.join(","))
      .order("meeting_time", { ascending: true });

    if (error) throw error;
    return { items: (data ?? []).map(toMeeting) };
  },

  async findByIdForUser(meetingId: number, userId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .select(meetingSelect)
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const participantIds = (data.meeting_participants ?? []).map((participant: any) => Number(participant.user_id));
    if (Number(data.created_by) !== userId && !participantIds.includes(userId)) {
      return null;
    }
    return toMeeting(data);
  },

  async update(meetingId: number, userId: number, input: UpdateMeetingRequest) {
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("meeting_id, created_by, status")
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (meetingError) throw meetingError;
    if (!meeting) {
      throw Object.assign(new Error("존재하지 않는 모임입니다."), { status: 404, code: "NOT_FOUND" });
    }
    if (Number(meeting.created_by) !== userId) {
      throw Object.assign(new Error("모임 생성자만 정보를 수정할 수 있습니다."), { status: 403, code: "FORBIDDEN" });
    }
    if (meeting.status === "DECIDED" || meeting.status === "CLOSED") {
      throw Object.assign(new Error("메뉴가 확정된 모임은 수정할 수 없습니다."), { status: 409, code: "CONFLICT" });
    }

    const updates: Record<string, unknown> = {};
    if ("title" in input) updates.title = input.title?.trim() || null;
    if (typeof input.meetingTime === "string") updates.meeting_time = input.meetingTime;
    if (typeof input.meetingPurposeId === "number") updates.meeting_purpose_id = input.meetingPurposeId;
    if ("location" in input) updates.location = input.location?.trim() || null;

    const { error } = await supabaseAdmin.from("meetings").update(updates).eq("meeting_id", meetingId);
    if (error) throw error;
    return this.findByIdForUser(meetingId, userId);
  },

  async previewById(meetingId: number) {
    // 참여 전에도 모임 ID로 기본 정보와 구성원 표시 이름을 확인할 수 있게 합니다.
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .select(meetingSelect)
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw Object.assign(new Error("존재하지 않는 모임입니다."), { status: 404, code: "NOT_FOUND" });
    }
    if (data.status === "DECIDED" || data.status === "CLOSED") {
      throw Object.assign(new Error("이미 메뉴가 확정된 모임입니다."), { status: 409, code: "CONFLICT" });
    }
    return toMeeting(data);
  },

  async addParticipant(meetingId: number, input: AddMeetingParticipantRequest, attendanceStatus = "PENDING") {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_id, nickname")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      throw Object.assign(new Error("존재하지 않는 사용자입니다."), { status: 404, code: "NOT_FOUND" });
    }

    const displayName = input.displayName?.trim() || user.nickname;
    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .insert({
        meeting_id: meetingId,
        user_id: input.userId,
        display_name: displayName,
        attendance_status: attendanceStatus
      })
      .select("participant_id, meeting_id, user_id, display_name, attendance_status")
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("meeting_participants")
          .select("participant_id, meeting_id, user_id, display_name, attendance_status")
          .eq("meeting_id", meetingId)
          .eq("user_id", input.userId)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) return toParticipant(existing);

        throw Object.assign(new Error("이 모임에서 이미 사용 중인 표시 이름입니다."), { status: 409, code: "CONFLICT" });
      }

      throw error;
    }
    return toParticipant(data);
  },

  async joinById(meetingId: number, userId: number, displayName: string) {
    // 모임 단위 표시 이름 중복을 막고, 참여자는 즉시 JOINED 상태로 추가합니다.
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("meeting_id, status")
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (meetingError) throw meetingError;
    if (!meeting) {
      throw Object.assign(new Error("존재하지 않는 모임입니다."), { status: 404, code: "NOT_FOUND" });
    }
    if (meeting.status === "DECIDED" || meeting.status === "CLOSED") {
      throw Object.assign(new Error("이미 메뉴가 확정된 모임입니다."), { status: 409, code: "CONFLICT" });
    }

    const { data: participantRow, error: participantError } = await supabaseAdmin
      .from("meeting_participants")
      .insert({
        meeting_id: meetingId,
        user_id: userId,
        display_name: displayName.trim(),
        attendance_status: "JOINED"
      })
      .select("participant_id, meeting_id, user_id, display_name, attendance_status")
      .single();

    if (participantError) {
      if (participantError.code === "23505") {
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("meeting_participants")
          .select("participant_id, meeting_id, user_id, display_name, attendance_status")
          .eq("meeting_id", meetingId)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) return { meeting: await this.findByIdForUser(meetingId, userId), participant: toParticipant(existing) };

        throw Object.assign(new Error("이 모임에서 이미 사용 중인 표시 이름입니다."), { status: 409, code: "CONFLICT" });
      }

      throw participantError;
    }

    const participant = toParticipant(participantRow);
    return { meeting: await this.findByIdForUser(meetingId, userId), participant };
  },

  async listParticipants(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .select("participant_id, meeting_id, user_id, display_name, attendance_status")
      .eq("meeting_id", meetingId)
      .order("participant_id");

    if (error) throw error;
    return { items: (data ?? []).map(toParticipant) };
  }
};

function toMeeting(row: any) {
  const participants = row.meeting_participants ?? [];
  const creatorUserId = Number(row.created_by);
  const hasCreatorParticipant = participants.some((participant: any) => Number(participant.user_id) === creatorUserId);

  return {
    meetingId: Number(row.meeting_id),
    title: row.title,
    meetingTime: row.meeting_time,
    meetingPurposeId: Number(row.meeting_purpose_id),
    meetingPurposeName: row.meeting_purposes?.name,
    location: row.location,
    createdBy: Number(row.created_by),
    creatorNickname: row.users?.nickname,
    selectedMenuId: row.selected_menu_id == null ? null : Number(row.selected_menu_id),
    status: row.status,
    createdAt: row.created_at,
    participants: [
      ...(hasCreatorParticipant
        ? []
        : [{
            participantId: 0,
            meetingId: Number(row.meeting_id),
            userId: creatorUserId,
            displayName: row.users?.nickname ?? "모임장",
            attendanceStatus: "JOINED"
          }]),
      ...participants.map(toParticipant)
    ]
  };
}

function toParticipant(row: any) {
  return {
    participantId: Number(row.participant_id),
    meetingId: row.meeting_id == null ? undefined : Number(row.meeting_id),
    userId: row.user_id == null ? null : Number(row.user_id),
    displayName: row.display_name,
    attendanceStatus: row.attendance_status
  };
}
