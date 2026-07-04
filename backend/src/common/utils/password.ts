import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";

export function hashPassword(password: string) {
  return bcrypt.hash(password, env.bcryptSaltRounds);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
