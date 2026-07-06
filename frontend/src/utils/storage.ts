const ACCESS_TOKEN_KEY = "mukpick.accessToken";
const REFRESH_TOKEN_KEY = "mukpick.refreshToken";
const EXPIRES_AT_KEY = "mukpick.expiresAt";
const SESSION_META_KEY = "mukpick.session";
const APP_UI_STATE_KEY = "mukpick.appUiState";
const APP_UI_STATE_VERSION = 1;

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
  v?: number;
  activeTab?: "home" | "preferences" | "personal" | "meeting" | "history" | "profile";
  selectedMeetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
  personalRecommendations?: StoredRecommendation[];
};

export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // 저장소 사용이 불가능한 환경에서는 현재 요청만 인증 없이 진행합니다.
    }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // localStorage 접근이 막힌 환경에서도 로그아웃 흐름은 계속 진행합니다.
    }
  }
};

export const authSessionStorage = {
  get(): AuthSession | null {
    try {
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
    } catch {
      return null;
    }
  },
  set(session: AuthSession) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
      if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
      if (session.expiresAt) localStorage.setItem(EXPIRES_AT_KEY, String(session.expiresAt));
    } catch {
      // 저장 실패는 이후 API 인증 실패로 드러나므로 UI 흐름은 중단하지 않습니다.
    }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
    } catch {
      // localStorage 접근이 막힌 환경에서도 세션 정리 호출은 실패시키지 않습니다.
    }
  },
  shouldRefresh(bufferSeconds = 60) {
    const session = this.get();
    if (!session?.refreshToken || !session.expiresAt) return false;
    return session.expiresAt * 1000 <= Date.now() + bufferSeconds * 1000;
  }
};

export const sessionStorageMeta = {
  get(): SessionMeta | null {
    try {
      const raw = localStorage.getItem(SESSION_META_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SessionMeta;
    } catch {
      try {
        localStorage.removeItem(SESSION_META_KEY);
      } catch {
        // 저장소 접근 실패는 null 세션으로 처리합니다.
      }
      return null;
    }
  },
  set(meta: SessionMeta) {
    try {
      localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    } catch {
      // 저장소 사용 불가 시 새로고침 복원만 제한됩니다.
    }
  },
  clear() {
    try {
      localStorage.removeItem(SESSION_META_KEY);
    } catch {
      // 저장소 접근 실패는 무시합니다.
    }
  }
};

export const appUiStateStorage = {
  get(): AppUiState {
    try {
      const raw = localStorage.getItem(APP_UI_STATE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as AppUiState;
      return parsed.v === APP_UI_STATE_VERSION ? parsed : {};
    } catch {
      try {
        localStorage.removeItem(APP_UI_STATE_KEY);
      } catch {
        // 저장소 접근 실패는 빈 UI 상태로 처리합니다.
      }
      return {};
    }
  },
  patch(next: AppUiState) {
    try {
      const merged = { ...this.get(), ...next, v: APP_UI_STATE_VERSION };
      localStorage.setItem(APP_UI_STATE_KEY, JSON.stringify(merged));
    } catch {
      // UI 복원 상태 저장 실패는 현재 화면 사용을 막지 않습니다.
    }
  },
  clear() {
    try {
      localStorage.removeItem(APP_UI_STATE_KEY);
    } catch {
      // 저장소 접근 실패는 무시합니다.
    }
  }
};
