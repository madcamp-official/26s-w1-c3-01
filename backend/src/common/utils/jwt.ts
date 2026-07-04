import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export type AccessTokenPayload = {
  userId: number;
  email: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}
