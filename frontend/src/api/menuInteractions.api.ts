import { apiRequest } from "./client";

export type MenuInteractionType = "view" | "like" | "pick" | "dislike" | "bookmark";
export type ToggleableMenuInteractionType = "like" | "dislike" | "bookmark";

export type MenuInteractionState = {
  menuId: number;
  preference: "like" | "dislike" | null;
  bookmarked: boolean;
};

export const menuInteractionsApi = {
  listMine(menuIds?: number[]) {
    const query = menuIds && menuIds.length > 0 ? `?menuIds=${menuIds.join(",")}` : "";
    return apiRequest<MenuInteractionState[]>(`/menu-interactions/me${query}`);
  },

  create(menuId: number, interactionType: MenuInteractionType) {
    return apiRequest("/menu-interactions", {
      method: "POST",
      body: JSON.stringify({
        menuId,
        interactionType
      })
    });
  },

  setState(menuId: number, interactionType: ToggleableMenuInteractionType, selected: boolean) {
    return apiRequest<MenuInteractionState>(`/menu-interactions/${menuId}`, {
      method: "PUT",
      body: JSON.stringify({
        interactionType,
        selected
      })
    });
  }
};
