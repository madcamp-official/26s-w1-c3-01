const ACCESS_TOKEN_KEY = "mukpick.accessToken";
const REFRESH_TOKEN_KEY = "mukpick.refreshToken";
const EXPIRES_AT_KEY = "mukpick.expiresAt";
const SESSION_META_KEY = "mukpick.session";
const APP_UI_STATE_KEY = "mukpick.appUiState";

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type SessionMeta = {
  isGuest: boolean;
  meetingId?: number;
  displayName?: string;
};

export type StoredRecommendation = {
  menuId?: number;
  menu: string;
  score?: number;
  reason?: string;
  tags?: string[];
};

export type AppUiState = {
  activeTab?: "home" | "preferences" | "personal" | "meeting" | "history" | "profile";
  selectedMeetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
  personalRecommendations?: StoredRecommendation[];
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

export const authSessionStorage = {
  get(): AuthSession | null {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return null;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;
    const rawExpiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    const expiresAt = rawExpiresAt ? Number(rawExpiresAt) : undefined;

    return {
      accessToken,
      refreshToken,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined
    };
  },
  set(session: AuthSession) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    if (session.expiresAt) localStorage.setItem(EXPIRES_AT_KEY, String(session.expiresAt));
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  },
  shouldRefresh(bufferSeconds = 60) {
    const session = this.get();
    if (!session?.refreshToken || !session.expiresAt) return false;
    return session.expiresAt * 1000 <= Date.now() + bufferSeconds * 1000;
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

export const appUiStateStorage = {
  get(): AppUiState {
    const raw = localStorage.getItem(APP_UI_STATE_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as AppUiState;
    } catch {
      localStorage.removeItem(APP_UI_STATE_KEY);
      return {};
    }
  },
  patch(next: AppUiState) {
    const merged = { ...this.get(), ...next };
    localStorage.setItem(APP_UI_STATE_KEY, JSON.stringify(merged));
  },
  clear() {
    localStorage.removeItem(APP_UI_STATE_KEY);
  }
};
