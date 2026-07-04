import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { userService } from "./user.service.js";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, { user: await userService.getMe(req.auth!.userId) });
  } catch (error) {
    next(error);
  }
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, { user: await userService.updateMe(req.auth!.userId, req.body) });
  } catch (error) {
    next(error);
  }
};
