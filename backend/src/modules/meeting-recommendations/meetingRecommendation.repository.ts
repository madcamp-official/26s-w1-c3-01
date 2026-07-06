import { supabaseAdmin } from "../../config/supabase.js";

export const meetingRecommendationRepository = {
  async loadBase(meetingId: number) {
    const [meeting, participants, menus, menuTags, menuAllergies, purposeSuitability] = await Promise.all([
      supabaseAdmin.from("meetings").select("*").eq("meeting_id", meetingId).single(),
      supabaseAdmin.from("meeting_participants").select("user_id").eq("meeting_id", meetingId).not("user_id", "is", null),
      supabaseAdmin
        .from("menus")
        .select("menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)")
        .order("menu_id"),
      supabaseAdmin.from("menu_tags").select("menu_id, tag_id"),
      supabaseAdmin.from("menu_allergies").select("menu_id, allergy_id"),
      supabaseAdmin.from("menu_purpose_suitability").select("menu_id, meeting_purpose_id, suitability_score")
    ]);

    for (const result of [meeting, participants, menus, menuTags, menuAllergies, purposeSuitability]) {
      if (result.error) throw result.error;
    }

    const userIds = (participants.data ?? []).map((row) => Number(row.user_id)).filter(Boolean);
    const [categoryPreferences, tagPreferences, menuPreferences, userAllergies] = userIds.length
      ? await Promise.all([
          supabaseAdmin.from("user_category_preferences").select("user_id, category_id, preference_score").in("user_id", userIds),
          supabaseAdmin.from("user_tag_preferences").select("user_id, tag_id, preference_score").in("user_id", userIds),
          supabaseAdmin.from("user_menu_preferences").select("user_id, menu_id, preference_score").in("user_id", userIds),
          supabaseAdmin.from("user_allergies").select("user_id, allergy_id").in("user_id", userIds)
        ])
      : [];

    for (const result of [categoryPreferences, tagPreferences, menuPreferences, userAllergies]) {
      if (result?.error) throw result.error;
    }

    return {
      meeting: meeting.data,
      participantUserIds: userIds,
      menus: menus.data ?? [],
      menuTags: menuTags.data ?? [],
      menuAllergies: menuAllergies.data ?? [],
      purposeSuitability: purposeSuitability.data ?? [],
      categoryPreferences: categoryPreferences?.data ?? [],
      tagPreferences: tagPreferences?.data ?? [],
      menuPreferences: menuPreferences?.data ?? [],
      userAllergies: userAllergies?.data ?? []
    };
  },

  async saveRun(meetingId: number, results: Array<{ menuId: number; rankNo: number; totalScore: number; reason: string }>, config: unknown) {
    const { data: run, error: runError } = await supabaseAdmin
      .from("recommendation_runs")
      .insert({
        meeting_id: meetingId,
        algorithm_version: "weighted-v1",
        config_json: config
      })
      .select("run_id")
      .single();

    if (runError) throw runError;

    if (results.length > 0) {
      const { error } = await supabaseAdmin.from("meeting_recommendations").insert(
        results.map((item) => ({
          run_id: run.run_id,
          menu_id: item.menuId,
          rank_no: item.rankNo,
          total_score: item.totalScore,
          reason: item.reason
        }))
      );
      if (error) throw error;
    }

    await supabaseAdmin.from("meetings").update({ status: "RECOMMENDED" }).eq("meeting_id", meetingId);
    return { runId: Number(run.run_id) };
  },

  async latest(meetingId: number) {
    const { data: run, error: runError } = await supabaseAdmin
      .from("recommendation_runs")
      .select("run_id")
      .eq("meeting_id", meetingId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runError) throw runError;
    if (!run) return { runId: null, results: [] };

    const { data, error } = await supabaseAdmin
      .from("meeting_recommendations")
      .select("rank_no, total_score, reason, menus(menu_id, name, menu_categories(name))")
      .eq("run_id", run.run_id)
      .order("rank_no");

    if (error) throw error;
    return {
      runId: Number(run.run_id),
      results: (data ?? []).map((row: any) => ({
        rankNo: Number(row.rank_no),
        menuId: Number(row.menus?.menu_id),
        menuName: row.menus?.name,
        totalScore: Number(row.total_score),
        categoryName: row.menus?.menu_categories?.name,
        reason: row.reason
      }))
    };
  },

  async findMeetingForSelection(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .select("meeting_id, created_by, status")
      .eq("meeting_id", meetingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async selectMenu(meetingId: number, menuId: number) {
    const { data, error } = await supabaseAdmin
      .from("meetings")
      .update({ selected_menu_id: menuId, status: "DECIDED" })
      .eq("meeting_id", meetingId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async listGuestParticipants(meetingId: number) {
    const { data, error } = await supabaseAdmin
      .from("meeting_participants")
      .select("user_id, users(user_id, auth_user_id, user_type)")
      .eq("meeting_id", meetingId)
      .not("user_id", "is", null);

    if (error) throw error;
    return (data ?? [])
      .map((row: any) => row.users)
      .filter((user: any) => user?.auth_user_id && user.user_type === "GUEST")
      .map((user: any) => ({ userId: Number(user.user_id), authUserId: String(user.auth_user_id) }));
  },

  async deleteAuthUser(authUserId: string) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
    if (error) throw error;
  }
};
