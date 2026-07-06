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

    if (error) throw error;
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
    if (interactionType === "like" || interactionType === "dislike") {
      const oppositeType = interactionType === "like" ? "dislike" : "like";
      const { error } = await supabaseAdmin
        .from("user_menu_interactions")
        .delete()
        .eq("user_id", userId)
        .eq("menu_id", menuId)
        .eq("interaction_type", oppositeType);

      if (error) throw error;
    }

    if (!selected) {
      const { error } = await supabaseAdmin
        .from("user_menu_interactions")
        .delete()
        .eq("user_id", userId)
        .eq("menu_id", menuId)
        .eq("interaction_type", interactionType);

      if (error) throw error;
      return null;
    }

    const deleteExisting = await supabaseAdmin
      .from("user_menu_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("menu_id", menuId)
      .eq("interaction_type", interactionType);

    if (deleteExisting.error) throw deleteExisting.error;

    const { data, error } = await supabaseAdmin
      .from("user_menu_interactions")
      .insert({
        user_id: userId,
        menu_id: menuId,
        interaction_type: interactionType
      })
      .select("interaction_id, user_id, menu_id, interaction_type, created_at")
      .single();

    if (error) throw error;
    return data;
  }
};
