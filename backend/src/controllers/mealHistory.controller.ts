import type { RequestHandler } from "express";
import { created, ok } from "../utils/apiResponse.js";

export const createMealHistory: RequestHandler = (_req, res) => {
  created(res, null, "TODO: create meal history");
};

export const listMyMealHistory: RequestHandler = (_req, res) => {
  ok(res, []);
};

export const updateMealHistory: RequestHandler = (_req, res) => {
  ok(res, null, "TODO: update meal history");
};

export const deleteMealHistory: RequestHandler = (_req, res) => {
  ok(res, { deleted: true }, "TODO: delete meal history");
};
