import type { RequestHandler } from "express";
import { ok } from "../utils/apiResponse.js";

export const listMenus: RequestHandler = (_req, res) => {
  ok(res, { items: [], pagination: { limit: 50, offset: 0, total: 0 } });
};

export const getMenu: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: return menu detail");
};

export const listMenuCategories: RequestHandler = (_req, res) => {
  ok(res, []);
};

export const listTags: RequestHandler = (_req, res) => {
  ok(res, []);
};

export const listAllergies: RequestHandler = (_req, res) => {
  ok(res, []);
};

export const listMeetingPurposes: RequestHandler = (_req, res) => {
  ok(res, []);
};
