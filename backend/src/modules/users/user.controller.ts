import type { RequestHandler } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { userService } from "./user.service.js";
import { invalidateAuthCache, invalidateProfileCache } from "../../common/middlewares/auth.middleware.js";

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
    const user = await userService.updateMe(req.auth!.profile!.userId, req.body);
    invalidateAuthCache(req.auth!.accessToken);
    invalidateProfileCache(req.auth!.profile!.authUserId);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};
