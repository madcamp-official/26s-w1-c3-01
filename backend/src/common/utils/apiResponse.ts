import type { Response } from "express";

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  message: string | null = null
) {
  res.status(status).json({ success: true, data, message });
}
