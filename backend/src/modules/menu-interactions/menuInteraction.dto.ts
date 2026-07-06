export type MenuInteractionType = "view" | "like" | "pick" | "dislike" | "bookmark";
export type ToggleableMenuInteractionType = "like" | "dislike" | "bookmark";

export type CreateMenuInteractionRequest = {
  menuId: number;
  interactionType: MenuInteractionType;
};

export type SetMenuInteractionRequest = {
  interactionType: ToggleableMenuInteractionType;
  selected: boolean;
};

export type MenuInteractionResponse = {
  interactionId: number;
  userId: number;
  menuId: number;
  interactionType: MenuInteractionType;
  createdAt: string;
};

export type MenuInteractionState = {
  menuId: number;
  preference: "like" | "dislike" | null;
  bookmarked: boolean;
};
