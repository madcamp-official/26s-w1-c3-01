import { supabaseAdmin } from "../../config/supabase.js";
import type { MeetingRecommendationConfig, MeetingRecommendationResult } from "./meetingRecommendation.dto.js";

const latestRecommendationSelect = `
  recommendation_id,
  run_id,
  menu_id,
  rank_no,
  total_score,
  reason,
  menus(menu_id, name, description)
`;

export const meetingRecommendationRepository = {
  async findMeetingById(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .select("meeting_id, created_by, meeting_purpose_id, selected_menu_id, status")
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async isMeetingParticipant(meetingId: number, userId: number) {
    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .select("participant_id")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .neq("attendance_status", "DECLINED")
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  },

  async loadMeetingRecommendationBase(meetingId: number) {
    const meeting = await this.findMeetingById(meetingId);
    if (!meeting) return null;

    const { data: participants, error: participantError } = await supabaseAdmin
      .from("meeting_participants")
      .select("participant_id, meeting_id, user_id, display_name, attendance_status")
      .eq("meeting_id", meetingId)
      .neq("attendance_status", "DECLINED");

    if (participantError) throw participantError;

    const participantUserIds = (participants ?? [])
      .map((participant) => participant.user_id)
      .filter((userId): userId is number => userId !== null);

    const [
      menus,
      menuTags,
      menuAllergies,
      purposeSuitability,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory
    ] = await Promise.all([
      supabaseAdmin
        .from("menus")
        .select("menu_id, category_id, name, description")
        .order("menu_id"),

      supabaseAdmin
        .from("menu_tags")
        .select("menu_id, tag_id"),

      supabaseAdmin
        .from("menu_allergies")
        .select("menu_id, allergy_id"),

      supabaseAdmin
        .from("menu_purpose_suitability")
        .select("menu_id, meeting_purpose_id, suitability_score")
        .eq("meeting_purpose_id", meeting.meeting_purpose_id),

      supabaseAdmin
        .from("user_menu_preferences")
        .select("user_id, menu_id, preference_score")
        .in("user_id", safeInValues(participantUserIds)),

      supabaseAdmin
        .from("user_category_preferences")
        .select("user_id, category_id, preference_score")
        .in("user_id", safeInValues(participantUserIds)),

      supabaseAdmin
        .from("user_tag_preferences")
        .select("user_id, tag_id, preference_score")
        .in("user_id", safeInValues(participantUserIds)),

      supabaseAdmin
        .from("user_allergies")
        .select("user_id, allergy_id")
        .in("user_id", safeInValues(participantUserIds)),

      supabaseAdmin
        .from("meal_history")
        .select("user_id, menu_id, rating, eaten_at")
        .in("user_id", safeInValues(participantUserIds))
    ]);

    for (const result of [
      menus,
      menuTags,
      menuAllergies,
      purposeSuitability,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory
    ]) {
      if (result.error) throw result.error;
    }

    return {
      meeting,
      participants: participants ?? [],
      menus: menus.data ?? [],
      menuTags: menuTags.data ?? [],
      menuAllergies: menuAllergies.data ?? [],
      purposeSuitability: purposeSuitability.data ?? [],
      userMenuPreferences: userMenuPreferences.data ?? [],
      userCategoryPreferences: userCategoryPreferences.data ?? [],
      userTagPreferences: userTagPreferences.data ?? [],
      userAllergies: userAllergies.data ?? [],
      mealHistory: mealHistory.data ?? []
    };
  },

  async saveRun(meetingId: number, config: MeetingRecommendationConfig, results: MeetingRecommendationResult[]) {
    const { data: run, error: runError } = await supabaseAdmin
      .from("recommendation_runs")
      .insert({
        meeting_id: meetingId,
        algorithm_version: "meeting-v1",
        config_json: config
      })
      .select("run_id, meeting_id, algorithm_version, config_json, generated_at")
      .single();

    if (runError) throw runError;

    if (results.length > 0) {
      const { error: resultError } = await supabaseAdmin
        .from("meeting_recommendations")
        .insert(results.map((result) => ({
          run_id: run.run_id,
          menu_id: result.menuId,
          rank_no: result.rankNo,
          total_score: result.totalScore,
          reason: result.reason
        })));

      if (resultError) throw resultError;
    }

    // 추천 결과가 생성되면 모임 상태도 추천 완료로 맞춰 이후 확정 단계와 구분한다.
    const { error: meetingStatusError } = await supabaseAdmin
      .from("meetings")
      .update({ status: "RECOMMENDED" })
      .eq("meeting_id", meetingId);

    if (meetingStatusError) throw meetingStatusError;

    return run;
  },

  async findLatestRun(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("recommendation_runs")
      .select("run_id, meeting_id, algorithm_version, config_json, generated_at")
      .eq("meeting_id", meetingId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findResultsByRunId(runId: number) {
    const { data, error } = await supabaseAdmin
      .from("meeting_recommendations")
      .select(latestRecommendationSelect)
      .eq("run_id", runId)
      .order("rank_no", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      rankNo: row.rank_no,
      menuId: row.menu_id,
      menuName: firstOrSelf(row.menus)?.name ?? "",
      totalScore: Number(row.total_score),
      reason: row.reason ?? ""
    }));
  },

  async findLatestResultByMenuId(meetingId: number, menuId: number) {
    const latestRun = await this.findLatestRun(meetingId);
    if (!latestRun) return null;

    // 메뉴 확정은 최신 추천 실행의 후보 중 하나만 허용한다.
    const { data, error } = await supabaseAdmin
      .from("meeting_recommendations")
      .select("recommendation_id, run_id, menu_id")
      .eq("run_id", latestRun.run_id)
      .eq("menu_id", menuId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async selectMenu(meetingId: number, menuId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .update({
        selected_menu_id: menuId,
        status: "DECIDED"
      })
      .eq("meeting_id", meetingId)
      .select("meeting_id, selected_menu_id, status")
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};

// Supabase .in()은 빈 배열을 받으면 에러가 날 수 있어 존재하지 않는 ID로 대체합니다.
function safeInValues(values: number[]) {
  return values.length > 0 ? values : [-1];
}

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
