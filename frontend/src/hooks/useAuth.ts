import { authStore } from "../store/authStore";

export function useAuth() {
  return {
    isAuthenticated: Boolean(authStore.getAccessToken()),
    accessToken: authStore.getAccessToken()
  };
}
