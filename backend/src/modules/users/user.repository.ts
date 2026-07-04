import { prisma } from "../../config/db.js";
import type { UpdateUserRequest } from "./user.dto.js";

export const userRepository = {
  findById(userId: number) {
    return prisma.user.findUnique({ where: { userId: BigInt(userId) } });
  },

  update(userId: number, input: UpdateUserRequest) {
    return prisma.user.update({
      where: { userId: BigInt(userId) },
      data: {
        nickname: input.nickname,
        userType: input.userType
      }
    });
  }
};
