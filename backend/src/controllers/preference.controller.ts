import type { RequestHandler } from "express";
import { ok } from "../utils/apiResponse.js";

export const getMyPreferences: RequestHandler = (_req, res) => {
  ok(res, {
    menuPreferences: [],
    categoryPreferences: [],
    tagPreferences: [],
    allergyIds: []
  });
};

export const replaceMyPreferences: RequestHandler = (_req, res) => {
  ok(res, { updated: true }, "TODO: replace all user preferences");
};

export const updateMyMenuPreferences: RequestHandler = (_req, res) => {
  ok(res, { updated: true }, "TODO: update menu preferences");
};

export const updateMyCategoryPreferences: RequestHandler = (_req, res) => {
  ok(res, { updated: true }, "TODO: update category preferences");
};

export const updateMyTagPreferences: RequestHandler = (_req, res) => {
  ok(res, { updated: true }, "TODO: update tag preferences");
};

export const updateMyAllergies: RequestHandler = (_req, res) => {
  ok(res, { updated: true }, "TODO: update allergy restrictions");
};
