import { supabaseAdmin } from "../../config/supabase.js";
import type { MeetingRecommendationConfig, MeetingRecommendationResult } from "./meetingRecommendation.dto.js";

const latestRecommendationSelect = `
  recommendation_id,
  run_id,
  menu_id,
  rank_no,
  total_score,
  scores_json,
  reason,
  menus(menu_id, name)
`;

const legacyRecommendationSelect = `
  recommendation_id,
  run_id,
  menu_id,
  rank_no,
  total_score,
  reason,
  menus(menu_id, name)
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

  async loadMeetingRecommendationBase(meetingId: number, selectedParticipantUserIds?: number[]) {
    const meeting = await this.findMeetingById(meetingId);
    if (!meeting) return null;

    const { data: participants, error: participantError } = await supabaseAdmin
      .from("meeting_participants")
      .select("participant_id, meeting_id, user_id, display_name, attendance_status")
      .eq("meeting_id", meetingId)
      .neq("attendance_status", "DECLINED");

    if (participantError) throw participantError;

    const participantsWithCreator = ensureCreatorParticipant(meeting, participants ?? []);
    const selectedParticipantSet = selectedParticipantUserIds?.length
      ? new Set(selectedParticipantUserIds.map(Number))
      : null;
    const participantUserIds = participantsWithCreator
      .map((participant) => participant.user_id)
      .filter((userId): userId is number => userId !== null)
      .filter((userId) => !selectedParticipantSet || selectedParticipantSet.has(Number(userId)));

    const [
      menus,
      purposeSuitability,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory,
      userPreferences
    ] = await Promise.all([
      supabaseAdmin
        .from("menu_recommendation_features")
        .select("menu_id, category_id, name, price_level, tag_ids, allergy_ids")
        .order("menu_id"),

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
        .in("user_id", safeInValues(participantUserIds)),

      supabaseAdmin
        .from("user_preferences")
        .select("user_id, budget_min, budget_max")
        .in("user_id", safeInValues(participantUserIds))
    ]);

    for (const result of [
      menus,
      purposeSuitability,
      userMenuPreferences,
      userCategoryPreferences,
      userTagPreferences,
      userAllergies,
      mealHistory,
      userPreferences
    ]) {
      if (result.error) throw result.error;
    }

    return {
      meeting,
      participants: participantsWithCreator,
      menus: menus.data ?? [],
      purposeSuitability: purposeSuitability.data ?? [],
      userMenuPreferences: userMenuPreferences.data ?? [],
      userCategoryPreferences: userCategoryPreferences.data ?? [],
      userTagPreferences: userTagPreferences.data ?? [],
      userAllergies: userAllergies.data ?? [],
      mealHistory: mealHistory.data ?? [],
      userPreferences: userPreferences.data ?? []
    };
  },

  async saveRun(meetingId: number, config: MeetingRecommendationConfig, results: MeetingRecommendationResult[]) {
    const { data: run, error: runError } = await supabaseAdmin
      .from("recommendation_runs")
      .insert({
        meeting_id: meetingId,
        algorithm_version: "meeting-group-v2",
        config_json: config
      })
      .select("run_id, meeting_id, algorithm_version, config_json, generated_at")
      .single();

    if (runError) throw runError;

    if (results.length > 0) {
      await insertMeetingRecommendationResults(Number(run.run_id), results);
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
    const result = await supabaseAdmin
      .from("meeting_recommendations")
      .select(latestRecommendationSelect)
      .eq("run_id", runId)
      .order("rank_no", { ascending: true });

    const { data, error } = isMissingScoresColumnError(result.error)
      ? await supabaseAdmin
        .from("meeting_recommendations")
        .select(legacyRecommendationSelect)
        .eq("run_id", runId)
        .order("rank_no", { ascending: true })
      : result;

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      rankNo: row.rank_no,
      menuId: row.menu_id,
      menuName: firstOrSelf(row.menus)?.name ?? "",
      totalScore: Number(row.total_score),
      reason: row.reason ?? "",
      scores: normalizeMeetingScores(row.scores_json)
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

function ensureCreatorParticipant(
  meeting: { meeting_id: number; created_by: number },
  participants: Array<{
    participant_id: number;
    meeting_id: number;
    user_id: number | null;
    display_name: string;
    attendance_status: string;
  }>
) {
  const creatorUserId = Number(meeting.created_by);
  const hasCreator = participants.some((participant) => Number(participant.user_id) === creatorUserId);
  if (hasCreator) return participants;

  return [
    {
      participant_id: 0,
      meeting_id: Number(meeting.meeting_id),
      user_id: creatorUserId,
      display_name: "모임장",
      attendance_status: "JOINED"
    },
    ...participants
  ];
}

// Supabase .in()은 빈 배열을 받으면 에러가 날 수 있어 존재하지 않는 ID로 대체합니다.
function safeInValues(values: number[]) {
  return values.length > 0 ? values : [-1];
}

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function insertMeetingRecommendationResults(runId: number, results: MeetingRecommendationResult[]) {
  const rows = results.map((result) => ({
    run_id: runId,
    menu_id: result.menuId,
    rank_no: result.rankNo,
    total_score: result.totalScore,
    scores_json: result.scores,
    reason: result.reason
  }));
  const { error } = await supabaseAdmin
    .from("meeting_recommendations")
    .insert(rows);

  if (!isMissingScoresColumnError(error)) {
    if (error) throw error;
    return;
  }

  const { error: legacyError } = await supabaseAdmin
    .from("meeting_recommendations")
    .insert(rows.map(({ scores_json: _scoresJson, ...row }) => row));

  if (legacyError) throw legacyError;
}

function isMissingScoresColumnError(error: any) {
  return Boolean(error && (error.code === "42703" || String(error.message ?? "").includes("scores_json")));
}

function normalizeMeetingScores(value: unknown) {
  const scores = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    category_score: readNumericScore(scores.category_score),
    tag_score: readNumericScore(scores.tag_score),
    menu_preference_score: readNumericScore(scores.menu_preference_score),
    budget_score: readNumericScore(scores.budget_score),
    group_preference_score: readNumericScore(scores.group_preference_score),
    minimum_participant_score: readNumericScore(scores.minimum_participant_score),
    purpose_score: readNumericScore(scores.purpose_score)
  };
}

function readNumericScore(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}
