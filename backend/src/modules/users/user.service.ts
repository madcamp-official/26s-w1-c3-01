import { userRepository } from "./user.repository.js";
import type { UpdateUserRequest } from "./user.dto.js";

export const userService = {
  getMe(userId: number) {
    return userRepository.findById(userId);
  },

  searchUsers(query?: string) {
    return userRepository.search(query);
  },

  updateMe(userId: number, input: UpdateUserRequest) {
    return userRepository.update(userId, input);
  }
};
