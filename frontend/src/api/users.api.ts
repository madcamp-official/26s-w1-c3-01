import { apiRequest } from "./client";

export const usersApi = {
  list(query = "") {
    const search = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
    return apiRequest(`/users${search}`);
  },
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
