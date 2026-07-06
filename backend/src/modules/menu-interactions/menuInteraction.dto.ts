export type MenuInteractionType = "view" | "like" | "pick" | "dislike" | "bookmark";

export type CreateMenuInteractionRequest = {
  menuId: number;
  interactionType: MenuInteractionType;
};

export type MenuInteractionResponse = {
  interactionId: number;
  userId: number;
  menuId: number;
  interactionType: MenuInteractionType;
  createdAt: string;
};
