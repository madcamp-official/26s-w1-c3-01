import { tokenStorage } from "../utils/storage";

let accessToken = tokenStorage.get();

export const authStore = {
  getAccessToken() {
    return accessToken;
  },
  setAccessToken(token: string) {
    accessToken = token;
    tokenStorage.set(token);
  },
  clear() {
    accessToken = null;
    tokenStorage.clear();
  }
};
