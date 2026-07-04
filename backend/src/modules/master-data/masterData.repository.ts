import { supabaseAdmin } from "../../config/supabase.js";

export const masterDataRepository = {
  async findMenus() {
    const { data, error } = await supabaseAdmin
      .from("menus")
      .select("menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)")
      .order("menu_id");

    if (error) throw error;
    return { items: data ?? [] };
  },

  async findMenuById(menuId: number) {
    const { data, error } = await supabaseAdmin
      .from("menus")
      .select("menu_id, category_id, name, description, spicy_level, price_level, calorie, menu_categories(category_id, name)")
      .eq("menu_id", menuId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async listTable(table: "menu_categories" | "tags" | "allergies" | "meeting_purposes") {
    const { data, error } = await supabaseAdmin.from(table).select("*");
    if (error) throw error;
    return data ?? [];
  }
};
