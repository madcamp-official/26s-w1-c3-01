import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { menuInteractionService } from "./menuInteraction.service.js";

export const createMenuInteraction: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.profile!.userId;
    sendSuccess(res, await menuInteractionService.createMenuInteraction(userId, req.body), 201);
  } catch (error) {
    next(error);
  }
};
