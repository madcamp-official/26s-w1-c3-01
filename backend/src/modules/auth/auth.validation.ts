import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().min(1),
  userType: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const guestSignupSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional()
}).optional();
