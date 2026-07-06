import { userRepository } from "./user.repository.js";
import type { UpdateUserRequest } from "./user.dto.js";

export const userService = {
  // user_id 기준으로 앱 사용자 profile을 조회한다.
  async getMe(userId: number) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw Object.assign(new Error("사용자를 찾을 수 없습니다."), {
        status: 404,
        code: "NOT_FOUND"
      });
    }

    return user;
  },

  // 닉네임, 사용자 유형 등 수정 가능한 profile 필드를 업데이트한다.
  async updateMe(userId: number, input: UpdateUserRequest) {
    if (input.nickname !== undefined) {
      const nicknameOwner = await userRepository.findByNickname(input.nickname);

      // 닉네임은 화면 표시와 모임 참여자 식별에 쓰이므로 다른 사용자와 중복되지 않게 막는다.
      if (nicknameOwner && nicknameOwner.userId !== userId) {
        throw Object.assign(new Error("이미 사용 중인 닉네임입니다."), {
          status: 409,
          code: "CONFLICT"
        });
      }
    }

    return userRepository.update(userId, input);
  }
};
