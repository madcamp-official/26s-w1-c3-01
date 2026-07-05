import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { userService } from "./user.service.js";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, { user: await userService.getMe(req.auth!.profile!.userId) });
  } catch (error) {
    next(error);
  }
};

export const searchUsers: RequestHandler = async (req, res, next) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    sendSuccess(res, { items: await userService.searchUsers(query) });
  } catch (error) {
    next(error);
  }
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    sendSuccess(res, { user: await userService.updateMe(req.auth!.profile!.userId, req.body) });
  } catch (error) {
    next(error);
  }
};
