import type { Response } from "express";
import type { ApiSuccess } from "../types/api.js";

export function ok<T>(res: Response, data: T, message: string | null = null): void {
  res.status(200).json(success(data, message));
}

export function created<T>(res: Response, data: T, message: string | null = null): void {
  res.status(201).json(success(data, message));
}

function success<T>(data: T, message: string | null): ApiSuccess<T> {
  return {
    success: true,
    data,
    message
  };
}
