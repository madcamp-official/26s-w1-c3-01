import type {
  CreateMenuInteractionRequest,
  MenuInteractionResponse,
  MenuInteractionState,
  SetMenuInteractionRequest
} from "./menuInteraction.dto.js";
import { menuInteractionRepository } from "./menuInteraction.repository.js";

export const menuInteractionService = {
  async createMenuInteraction(
    userId: number,
    input: CreateMenuInteractionRequest
  ): Promise<MenuInteractionResponse> {
    const row = await menuInteractionRepository.create(userId, input);

    return {
      interactionId: Number(row.interaction_id),
      userId: Number(row.user_id),
      menuId: Number(row.menu_id),
      interactionType: row.interaction_type,
      createdAt: row.created_at
    };
  },

  async listMyInteractionStates(userId: number, menuIds?: number[]): Promise<MenuInteractionState[]> {
    const rows = await menuInteractionRepository.findToggleStates(userId, menuIds);
    const stateMap = new Map<number, MenuInteractionState>();

    for (const row of rows) {
      const menuId = Number(row.menu_id);
      const current = stateMap.get(menuId) ?? {
        menuId,
        preference: null,
        bookmarked: false
      };

      if (row.interaction_type === "like" && current.preference === null) {
        current.preference = "like";
      }

      if (row.interaction_type === "dislike" && current.preference === null) {
        current.preference = "dislike";
      }

      if (row.interaction_type === "bookmark") {
        current.bookmarked = true;
      }

      stateMap.set(menuId, current);
    }

    return Array.from(stateMap.values());
  },

  async setMenuInteractionState(
    userId: number,
    menuId: number,
    input: SetMenuInteractionRequest
  ): Promise<MenuInteractionState> {
    const state = await menuInteractionRepository.setToggleState(
      userId,
      menuId,
      input.interactionType,
      input.selected
    );

    return {
      menuId: Number(state.menu_id),
      preference: state.preference === "like" || state.preference === "dislike" ? state.preference : null,
      bookmarked: Boolean(state.bookmarked)
    };
  }
};
