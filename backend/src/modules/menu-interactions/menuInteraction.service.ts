import type { CreateMenuInteractionRequest, MenuInteractionResponse } from "./menuInteraction.dto.js";
import { menuInteractionRepository } from "./menuInteraction.repository.js";

export const menuInteractionService = {
  async createMenuInteraction(
    userId: number,
    input: CreateMenuInteractionRequest
  ): Promise<MenuInteractionResponse> {
    const menu = await menuInteractionRepository.findMenuById(input.menuId);

    if (!menu) {
      throw Object.assign(new Error("존재하지 않는 메뉴입니다."), {
        status: 404,
        code: "NOT_FOUND"
      });
    }

    const row = await menuInteractionRepository.create(userId, input);

    return {
      interactionId: Number(row.interaction_id),
      userId: Number(row.user_id),
      menuId: Number(row.menu_id),
      interactionType: row.interaction_type,
      createdAt: row.created_at
    };
  }
};
