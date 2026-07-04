import { apiRequest } from "./client";

export const usersApi = {
  getMe() {
    return apiRequest("/users/me");
  },
  updateMe(body: unknown) {
    return apiRequest("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }
};
