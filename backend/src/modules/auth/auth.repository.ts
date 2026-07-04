import { prisma } from "../../config/db.js";
import type { SignupRequest } from "./auth.dto.js";

export const authRepository = {
  createUser(input: SignupRequest & { passwordHash: string }) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        nickname: input.nickname,
        userType: input.userType ?? "PERSONAL"
      }
    });
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
};
