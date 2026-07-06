import { supabaseAdmin } from "../../config/supabase.js";
import type {
  CreateMenuInteractionRequest,
  ToggleableMenuInteractionType
} from "./menuInteraction.dto.js";

export const menuInteractionRepository = {
  async findMenuById(menuId: number) {
    const { data, error } = await supabaseAdmin
      .from("menus")
      .select("menu_id")
      .eq("menu_id", menuId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userId: number, input: CreateMenuInteractionRequest) {
    const { data, error } = await supabaseAdmin
      .from("user_menu_interactions")
      .insert({
        user_id: userId,
        menu_id: input.menuId,
        interaction_type: input.interactionType
      })
      .select("interaction_id, user_id, menu_id, interaction_type, created_at")
      .single();

    if (error) throw toMenuInteractionError(error);
    return data;
  },

  async findToggleStates(userId: number, menuIds?: number[]) {
    let query = supabaseAdmin
      .from("user_menu_interactions")
      .select("menu_id, interaction_type, created_at")
      .eq("user_id", userId)
      .in("interaction_type", ["like", "dislike", "bookmark"])
      .order("created_at", { ascending: false });

    if (menuIds && menuIds.length > 0) {
      query = query.in("menu_id", menuIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async setToggleState(
    userId: number,
    menuId: number,
    interactionType: ToggleableMenuInteractionType,
    selected: boolean
  ) {
    const { data, error } = await supabaseAdmin.rpc("set_menu_interaction_state", {
      p_user_id: userId,
      p_menu_id: menuId,
      p_interaction_type: interactionType,
      p_selected: selected
    });

    if (error) throw toMenuInteractionError(error);
    return data?.[0] ?? { menu_id: menuId, preference: null, bookmarked: false };
  }
};

function toMenuInteractionError(error: { code?: string; message?: string }) {
  if (error.code === "23503" || error.code === "P0002") {
    return Object.assign(new Error("존재하지 않는 메뉴입니다."), {
      status: 404,
      code: "NOT_FOUND"
    });
  }

  return error;
}
