const ACCESS_TOKEN_KEY = "mukpick.accessToken";
const SESSION_META_KEY = "mukpick.session";

export type SessionMeta = {
  isGuest: boolean;
  meetingId?: number;
  displayName?: string;
};

export const tokenStorage = {
  get() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const sessionStorageMeta = {
  get(): SessionMeta | null {
    const raw = localStorage.getItem(SESSION_META_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionMeta;
    } catch {
      localStorage.removeItem(SESSION_META_KEY);
      return null;
    }
  },
  set(meta: SessionMeta) {
    localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
  },
  clear() {
    localStorage.removeItem(SESSION_META_KEY);
  }
};
