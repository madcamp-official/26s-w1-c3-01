import { authSessionStorage, tokenStorage } from "../utils/storage";

let accessToken = tokenStorage.get();

export const authStore = {
  getAccessToken() {
    return accessToken;
  },
  setAccessToken(token: string) {
    accessToken = token;
    tokenStorage.set(token);
  },
  setSession(session: { accessToken: string; refreshToken?: string; expiresAt?: number }) {
    accessToken = session.accessToken;
    authSessionStorage.set(session);
  },
  clear() {
    accessToken = null;
    authSessionStorage.clear();
  }
};
