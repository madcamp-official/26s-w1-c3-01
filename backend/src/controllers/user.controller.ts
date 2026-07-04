import type { RequestHandler } from "express";
import { ok } from "../utils/apiResponse.js";

export const getMe: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: return current user profile");
};

export const updateMe: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: update current user profile");
};
