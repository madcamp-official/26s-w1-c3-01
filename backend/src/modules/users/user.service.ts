import { userRepository } from "./user.repository.js";
import type { UpdateUserRequest } from "./user.dto.js";

export const userService = {
  getMe(userId: number) {
    return userRepository.findById(userId);
  },

  searchUsers(query?: string) {
    return userRepository.search(query);
  },

  async updateMe(userId: number, input: UpdateUserRequest) {
    const nextInput = {
      ...input,
      nickname: input.nickname?.trim()
    };

    if (nextInput.nickname) {
      const existing = await userRepository.findByNickname(nextInput.nickname);
      if (existing && existing.userId !== userId) {
        throw Object.assign(new Error("이미 사용 중인 닉네임입니다."), { status: 409, code: "CONFLICT" });
      }
    }

    return userRepository.update(userId, nextInput);
  }
};
