import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { menuInteractionService } from "./menuInteraction.service.js";
import { menuInteractionParamsSchema } from "./menuInteraction.validation.js";

export const createMenuInteraction: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    sendSuccess(res, await menuInteractionService.createMenuInteraction(userId, req.body), 201);
  } catch (error) {
    next(error);
  }
};

export const listMyMenuInteractionStates: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    const menuIds = String(req.query.menuIds ?? "")
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    sendSuccess(
      res,
      await menuInteractionService.listMyInteractionStates(userId, menuIds.length > 0 ? menuIds : undefined)
    );
  } catch (error) {
    next(error);
  }
};

export const setMenuInteractionState: RequestHandler = async (req, res, next) => {
  try {
    const parsed = menuInteractionParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      throw Object.assign(new Error("요청 값이 올바르지 않습니다."), {
        status: 400,
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten()
      });
    }

    const userId = req.auth!.profile!.userId;
    sendSuccess(
      res,
      await menuInteractionService.setMenuInteractionState(userId, parsed.data.menuId, req.body)
    );
  } catch (error) {
    next(error);
  }
};
