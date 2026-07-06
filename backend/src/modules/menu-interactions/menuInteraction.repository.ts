import { supabaseAdmin } from "../../config/supabase.js";
import type { CreateMenuInteractionRequest } from "./menuInteraction.dto.js";

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
  }
};
