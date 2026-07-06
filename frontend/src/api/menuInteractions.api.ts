import { apiRequest } from "./client";

export type MenuInteractionType = "view" | "like" | "pick" | "dislike" | "bookmark";

export const menuInteractionsApi = {
  create(menuId: number, interactionType: MenuInteractionType) {
    return apiRequest("/menu-interactions", {
      method: "POST",
      body: JSON.stringify({
        menuId,
        interactionType
      })
    });
  }
};
