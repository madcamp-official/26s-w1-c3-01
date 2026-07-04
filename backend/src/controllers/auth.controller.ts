import type { RequestHandler } from "express";
import { created, ok } from "../utils/apiResponse.js";

export const signup: RequestHandler = (_req, res) => {
  created(res, null, "TODO: create user and issue access token");
};

export const login: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: verify credentials and issue access token");
};

export const logout: RequestHandler = (_req, res) => {
  ok(res, { loggedOut: true }, "TODO: handle logout policy");
};
