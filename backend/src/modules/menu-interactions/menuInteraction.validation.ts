import { z } from "zod";

const interactionTypeSchema = z.enum(["view", "like", "pick", "dislike", "bookmark"]);

export const createMenuInteractionSchema = z
  .object({
    menuId: z.coerce.number().int().positive().optional(),
    menu_id: z.coerce.number().int().positive().optional(),
    interactionType: interactionTypeSchema.optional(),
    interaction_type: interactionTypeSchema.optional()
  })
  .transform((value) => ({
    menuId: value.menuId ?? value.menu_id,
    interactionType: value.interactionType ?? value.interaction_type
  }))
  .refine((value) => value.menuId !== undefined && value.interactionType !== undefined, {
    message: "menuId/menu_id와 interactionType/interaction_type은 필수입니다."
  });
