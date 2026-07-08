# MUK PICK Frontend API and State Contract

## 1. 목적

이 문서는 MUK PICK 프론트엔드가 backend API, 인증 토큰, refresh token, 게스트 세션, URL 상태, 앱 UI 복원 상태, 추천 결과, 로딩/에러 상태를 어떻게 다루는지 정의한다.

현재 프론트엔드는 `React + Vite + TypeScript` 기반이며, 모든 백엔드 API 호출은 `frontend/src/api/client.ts`의 `apiRequest`를 통해 수행한다. 상태 관리는 React state를 기본으로 사용하고, 새로고침 복원이 필요한 인증/세션/UI 상태는 `localStorage`와 URL로 보조 저장한다.

---

## 2. API Client 기준

모든 API 호출은 `frontend/src/api/client.ts`의 `apiRequest`를 통해 수행한다.

```text id="qfgo4m"
VITE_API_BASE_URL + path
```

기본값:

```text id="s1o5cd"
/api/v1
```

`VITE_API_BASE_URL`이 없으면 `/api/v1`을 사용한다.

로컬 Vite 개발 서버에서는 `/api` 요청을 백엔드 서버로 proxy하도록 구성한다. 프론트만 별도 배포하는 경우에는 반드시 실제 백엔드 주소를 `VITE_API_BASE_URL`에 넣어야 한다.

---

## 3. 배포 환경 변수

프론트엔드만 별도 배포할 경우 다음 환경 변수를 설정한다.

```text id="en51v2"
VITE_API_BASE_URL=https://{backend-domain}/api/v1
VITE_SUPABASE_URL=https://{project-ref}.supabase.co
VITE_SUPABASE_ANON_KEY={supabase-anon-or-publishable-key}
```

설명:

| 변수                       | 설명                                        |
| ------------------------ | ----------------------------------------- |
| `VITE_API_BASE_URL`      | Express backend API base URL              |
| `VITE_SUPABASE_URL`      | Supabase project URL                      |
| `VITE_SUPABASE_ANON_KEY` | 브라우저에서 사용하는 Supabase anon/publishable key |

주의:

* `VITE_SUPABASE_ANON_KEY`는 브라우저에서 사용하는 공개 anon/publishable key이다.
* Supabase `service_role` key는 절대 프론트 환경변수에 넣지 않는다.
* `VITE_API_BASE_URL`이 없고 같은 도메인에 backend가 없다면 `/api/v1` 요청이 Vite fallback HTML을 반환할 수 있다.
* 프론트는 응답 `content-type`이 JSON이 아니면 JSON parsing error 대신 API 서버 설정 문제로 안내한다.

---

## 4. API 응답 포맷

프론트는 backend 응답을 다음 형태로 기대한다.

```ts id="oqofbt"
type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
  };
};
```

처리 기준:

* `success = true`이면 `data`를 반환한다.
* `success = false`이면 `error.message`를 사용자에게 전달 가능한 에러 메시지로 사용한다.
* 인증 요청에서 `401` 또는 `403`이 발생하면 저장된 인증 상태를 정리하고 `AuthSessionExpiredError`를 발생시킨다.
* 응답이 JSON이 아니면 `VITE_API_BASE_URL` 또는 백엔드 서버 상태를 확인하라는 에러를 발생시킨다.

---

## 5. API 요청 인증 기준

### 5.1 기본 인증 방식

인증이 필요한 요청은 access token을 HTTP header에 넣어 보낸다.

```text id="o9vk53"
Authorization: Bearer {accessToken}
```

기본적으로 `apiRequest`는 인증 요청으로 처리한다. 인증이 필요 없는 요청은 다음처럼 명시한다.

```ts id="pzcksh"
apiRequest("/menus", { auth: false });
```

### 5.2 인증이 필요 없는 API 예시

| API                                 | 이유                               |
| ----------------------------------- | -------------------------------- |
| `POST /auth/signup`                 | 회원가입 전 호출                        |
| `POST /auth/signup/resend`          | 인증 메일 재전송                        |
| `POST /auth/login`                  | 로그인 전 호출                         |
| `POST /auth/refresh`                | refresh token으로 access token 재발급 |
| `GET /auth/nickname`                | 회원가입/온보딩 중 닉네임 중복 확인             |
| `POST /auth/guest`                  | 게스트 세션 시작                        |
| `GET /menus`                        | 온보딩 전 메뉴/마스터 데이터 필요              |
| `GET /menus/{menuId}`               | 메뉴 상세 조회                         |
| `GET /menu-categories`              | 온보딩 전 카테고리 선택                    |
| `GET /tags`                         | 온보딩 전 태그 선택                      |
| `GET /allergies`                    | 온보딩 전 제한 조건 선택                   |
| `GET /meeting-purposes`             | 모임 생성/preview 기본 데이터             |
| `GET /meetings/{meetingId}/preview` | 게스트가 모임 ID 입력 후 preview          |

---

## 6. Token 저장 계약

`frontend/src/utils/storage.ts`는 인증 세션을 `localStorage`에 저장한다.

| 항목            | key                    | 설명                         |
| ------------- | ---------------------- | -------------------------- |
| access token  | `mukpick.accessToken`  | API 인증에 사용                 |
| refresh token | `mukpick.refreshToken` | access token 갱신에 사용        |
| expires at    | `mukpick.expiresAt`    | access token 만료 시각         |
| session meta  | `mukpick.session`      | 게스트 여부, 모임 ID, displayName |
| app UI state  | `mukpick.appUiState`   | active tab, 선택된 모임/추천 복원   |

`AuthSession` 타입:

```ts id="fbh9il"
type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};
```

주의:

* `sessionStorageMeta`라는 이름을 쓰지만 실제 저장소는 `sessionStorage`가 아니라 `localStorage`이다.
* 이름은 기존 코드 호환을 위해 유지한다.
* 저장 실패는 앱 전체 흐름을 중단하지 않는다. 이후 API 인증 실패나 새로고침 복원 실패로 드러나게 처리한다.

---

## 7. Token Refresh 계약

### 7.1 refresh 실행 조건

`apiRequest`는 인증 요청 전 다음 조건을 확인한다.

```text id="n67032"
authSessionStorage.shouldRefresh()
```

현재 저장된 session에 `refreshToken`과 `expiresAt`이 있고, 만료까지 남은 시간이 buffer보다 짧으면 refresh를 수행한다.

기본 buffer:

```text id="sl8ls4"
60 seconds
```

### 7.2 refresh API

```text id="qmyx3y"
POST /auth/refresh
```

요청 body:

```json id="li52if"
{
  "refreshToken": "{refreshToken}"
}
```

응답 data 예시:

```json id="umfg5q"
{
  "accessToken": "{newAccessToken}",
  "refreshToken": "{newRefreshToken}",
  "expiresAt": 1780000000
}
```

응답에 새 refresh token이 없으면 기존 refresh token을 유지한다.

### 7.3 중복 refresh 방지

동시에 여러 API 요청이 발생해도 refresh 요청이 여러 번 나가지 않도록 `refreshPromise`를 공유한다.

```text id="gifx3l"
refreshPromise ??= refreshStoredSession().finally(() => {
  refreshPromise = null;
});
```

규칙:

* refresh 중이면 기존 promise를 재사용한다.
* refresh가 끝나면 `refreshPromise`를 null로 되돌린다.
* refresh 실패 시 저장된 인증 상태를 정리하고 세션 만료 오류를 발생시킨다.

### 7.4 401 재시도

인증 요청에서 `401`이 발생하고 refresh token이 있으면 다음 흐름으로 처리한다.

```text id="wksed8"
API 요청
-> 401
-> refreshStoredSessionOnce()
-> 새 access token으로 같은 요청 1회 재시도
-> 재시도 실패 또는 refresh 실패 시 세션 만료 처리
```

---

## 8. 인증 상태 정리 계약

인증 상태는 다음 상황에서 정리한다.

| 상황               | 처리                                                                    |
| ---------------- | --------------------------------------------------------------------- |
| 로그아웃             | access token, refresh token, expiresAt, session meta, app UI state 정리 |
| refresh 실패       | access token, refresh token, expiresAt, session meta 정리               |
| API에서 401/403 응답 | 인증 상태 정리 후 시작 화면으로 이동                                                 |
| 세션 만료 감지         | profile, meeting, recommendation, history, toast 등 앱 상태 reset         |

정리 대상:

```text id="vezq8m"
authSessionStorage.clear()
sessionStorageMeta.clear()
appUiStateStorage.clear()
```

앱 내부에서는 추가로 다음 상태를 reset한다.

```text id="7pxtcl"
resetAuthProfile()
resetMeetingState()
clearPersonalRecommendations()
clearHistories()
clearToast()
setFlow("start")
setActiveTab("home")
```

---

## 9. 세션 메타데이터 계약

`sessionStorageMeta`는 사용자 세션의 프론트 보조 정보를 저장한다.

```ts id="i6300k"
type SessionMeta = {
  isGuest: boolean;
  meetingId?: number;
  displayName?: string;
};
```

| 필드            | 설명             |
| ------------- | -------------- |
| `isGuest`     | 게스트 세션 여부      |
| `meetingId`   | 게스트가 참여한 모임 ID |
| `displayName` | 모임 안에서 표시할 이름  |

규칙:

* 게스트 세션은 앱 전체 탐색이 아니라 특정 모임 참여에 묶인다.
* 게스트 세션에서는 visible tab을 `meeting`으로 고정한다.
* 게스트가 모임을 이탈하거나 로그아웃하면 session meta를 삭제한다.
* 게스트 계정 정리는 backend에서 처리하지만, 프론트는 저장된 세션 메타데이터를 남기지 않는다.

---

## 10. App UI State 계약

`appUiStateStorage`는 새로고침 후 복원이 필요한 UI 상태를 저장한다.

```ts id="u39gkf"
type AppUiState = {
  v?: number;
  activeTab?: "home" | "preferences" | "personal" | "meeting" | "history" | "profile";
  selectedMeetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
  personalRecommendations?: StoredRecommendation[];
};
```

`StoredRecommendation` 타입:

```ts id="nomobo"
type StoredRecommendation = {
  menuId?: number;
  menu: string;
  score?: number;
  reason?: string;
  tags?: string[];
};
```

저장 규칙:

* `flow === "app"` 상태에서만 UI state를 저장한다.
* active tab이 바뀌면 저장한다.
* 선택된 모임 ID가 바뀌면 저장한다.
* 선택된 개인 추천 메뉴 ID가 바뀌면 저장한다.
* 선택된 모임 추천 메뉴 ID가 바뀌면 저장한다.
* 개인 추천 결과는 새로고침 후 복원을 위해 일부 필드만 저장한다.
* `v`는 UI state schema version이다. 현재 version과 다르면 빈 상태로 처리한다.

---

## 11. URL State 계약

프론트는 React Router를 쓰지 않고 자체 URL state sync를 사용한다.

### 11.1 지원 경로

| URL                                                   | 의미              |
| ----------------------------------------------------- | --------------- |
| `/`                                                   | 시작 또는 홈         |
| `/login`                                              | 로그인             |
| `/signup`                                             | 회원가입            |
| `/guest`                                              | 게스트 시작          |
| `/home`                                               | 홈               |
| `/preferences`                                        | 선호도 설정          |
| `/recommendations/personal`                           | 개인 추천           |
| `/recommendations/personal?selectedMenuId={menuId}`   | 선택된 개인 추천 메뉴 복원 |
| `/meetings`                                           | 모임 목록           |
| `/meetings/{meetingId}`                               | 모임 상세           |
| `/meetings/{meetingId}?recommendationMenuId={menuId}` | 선택된 모임 추천 메뉴 복원 |
| `/history`                                            | 식사 기록           |
| `/profile`                                            | 프로필             |
| `/me`                                                 | 프로필 alias       |

### 11.2 URL 읽기

`readAppRoute`는 현재 URL을 앱 상태로 변환한다.

```text id="jfs91r"
URL -> AppRouteState
```

`AppRouteState`:

```ts id="k05zh6"
type AppRouteState = {
  flow?: Flow;
  tab?: Tab;
  meetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
};
```

### 11.3 URL 쓰기

`buildAppUrl`은 현재 앱 상태를 URL로 변환한다.

```text id="e7x70g"
App state -> URL
```

규칙:

* `flow !== "app"`이면 로그인/회원가입/게스트/시작 URL을 사용한다.
* 게스트 세션이면 active tab과 관계없이 meeting URL을 사용한다.
* 개인 추천 선택 메뉴가 있으면 `selectedMenuId` query를 붙인다.
* 모임 추천 선택 메뉴가 있으면 `recommendationMenuId` query를 붙인다.
* URL 변경은 `window.history.pushState`로 수행한다.

### 11.4 popstate 처리

브라우저 뒤로가기/앞으로가기 시 `popstate` 이벤트를 감지한다.

흐름:

```text id="q0xud5"
popstate
-> readAppRoute()
-> applyRouteState()
-> 화면 상태 복원
```

URL이 있으면 URL 상태를 우선하고, 부족한 정보는 `appUiStateStorage`를 fallback으로 사용한다.

---

## 12. 주요 API 모듈

| 파일                        | 책임                                                                          |
| ------------------------- | --------------------------------------------------------------------------- |
| `client.ts`               | 공통 API 요청, token refresh, 공통 응답 처리                                          |
| `auth.api.ts`             | signup, resend, login, refresh, profile sync, nickname check, guest, logout |
| `oauth.api.ts`            | Supabase SDK 기반 Google OAuth 시작 및 callback token parsing                    |
| `users.api.ts`            | 내 정보, 사용자 목록, 프로필 수정                                                        |
| `masterData.api.ts`       | 메뉴, 카테고리, 태그, 알러지, 모임 목적                                                    |
| `preferences.api.ts`      | 기존 선호도 전체 조회/저장                                                             |
| `userPreferences.api.ts`  | 예산 조건 조회/저장                                                                 |
| `recommendations.api.ts`  | 개인 추천 생성                                                                    |
| `meetings.api.ts`         | 모임 생성/조회/수정/참여/추천/확정                                                        |
| `mealHistory.api.ts`      | 식사 기록 조회/생성/수정/삭제                                                           |
| `menuInteractions.api.ts` | 메뉴 상호작용 기록, 좋아요/싫어요/북마크 상태 조회/설정                                            |

---

## 13. API 모듈별 계약

### 13.1 `auth.api.ts`

| 함수                  | API                        | 인증    | 설명                    |
| ------------------- | -------------------------- | ----- | --------------------- |
| `signup`            | `POST /auth/signup`        | false | 이메일 회원가입              |
| `resendSignupEmail` | `POST /auth/signup/resend` | false | 인증 이메일 재전송            |
| `login`             | `POST /auth/login`         | false | 이메일 로그인               |
| `refresh`           | `POST /auth/refresh`       | false | access token 재발급      |
| `syncProfile`       | `POST /auth/profile`       | true  | OAuth 이후 profile sync |
| `checkNickname`     | `GET /auth/nickname`       | false | 닉네임 중복 확인             |
| `guest`             | `POST /auth/guest`         | false | 게스트 계정 생성             |
| `logout`            | `POST /auth/logout`        | true  | 로그아웃                  |

로그인, 회원가입, 게스트 시작, refresh 응답에서 access token이 내려오면 `authSessionStorage`에 저장한다.

---

### 13.2 `masterData.api.ts`

| 함수                    | API                     | 인증    | 설명           |
| --------------------- | ----------------------- | ----- | ------------ |
| `listMenus`           | `GET /menus`            | false | 메뉴 목록        |
| `getMenu`             | `GET /menus/{menuId}`   | false | 메뉴 상세        |
| `listMenuCategories`  | `GET /menu-categories`  | false | 카테고리 목록      |
| `listTags`            | `GET /tags`             | false | 태그 목록        |
| `listAllergies`       | `GET /allergies`        | false | 알러지/제한 조건 목록 |
| `listMeetingPurposes` | `GET /meeting-purposes` | false | 모임 목적 목록     |

Master data는 온보딩 전에도 필요하므로 인증 없이 호출한다.

---

### 13.3 `preferences.api.ts`

| 함수            | API                   | 인증   | 설명              |
| ------------- | --------------------- | ---- | --------------- |
| `getMine`     | `GET /preferences/me` | true | 기존 선호도 전체 조회    |
| `replaceMine` | `PUT /preferences/me` | true | 기존 선호도 전체 저장/교체 |

이 API는 카테고리, 태그, 알러지 등 기존 전체 선호도 payload 저장에 사용한다.

---

### 13.4 `userPreferences.api.ts`

| 함수       | API                     | 인증   | 설명       |
| -------- | ----------------------- | ---- | -------- |
| `get`    | `GET /user-preferences` | true | 예산 조건 조회 |
| `update` | `PUT /user-preferences` | true | 예산 조건 저장 |

요청/응답 모델:

```ts id="elblm0"
type UserPreferenceResponse = {
  userId: number;
  budgetMin: number | null;
  budgetMax: number | null;
};

type UpdateUserPreferenceRequest = {
  budgetMin: number | null;
  budgetMax: number | null;
};
```

예산 조건은 개인 추천과 모임 추천의 `budgetScore` 계산에 사용된다.

---

### 13.5 `recommendations.api.ts`

| 함수               | API                              | 인증   | 설명       |
| ---------------- | -------------------------------- | ---- | -------- |
| `createPersonal` | `POST /recommendations/personal` | true | 개인 추천 생성 |

요청 예시:

```json id="jz5e0y"
{
  "recentDuplicateDays": 7,
  "includeNewMenu": true,
  "budgetMin": 1,
  "budgetMax": 4,
  "limit": 5
}
```

개인 추천 결과는 `recommendationItems`로 변환되어 화면에 표시된다. 사용자가 최종 후보를 확정하기 전까지는 식사 기록을 생성하지 않는다.

---

### 13.6 `meetings.api.ts`

| 함수                        | API                                                | 인증    | 설명             |
| ------------------------- | -------------------------------------------------- | ----- | -------------- |
| `list`                    | `GET /meetings`                                    | true  | 내 모임 목록        |
| `create`                  | `POST /meetings`                                   | true  | 모임 생성          |
| `get`                     | `GET /meetings/{meetingId}`                        | true  | 모임 상세          |
| `update`                  | `PATCH /meetings/{meetingId}`                      | true  | 모임 수정          |
| `preview`                 | `GET /meetings/{meetingId}/preview`                | false | 게스트 모임 preview |
| `addParticipant`          | `POST /meetings/{meetingId}/participants`          | true  | 참여자 추가         |
| `join`                    | `POST /meetings/{meetingId}/join`                  | true  | 모임 참여          |
| `createRecommendation`    | `POST /meetings/{meetingId}/recommendations`       | true  | 모임 추천 생성       |
| `getLatestRecommendation` | `GET /meetings/{meetingId}/recommendations/latest` | true  | 최신 모임 추천 조회    |
| `selectMenu`              | `PATCH /meetings/{meetingId}/selected-menu`        | true  | 최종 메뉴 확정       |

모임 추천 요청에서 제외된 구성원은 `participantUserIds` 배열에서 빠진다.

---

### 13.7 `mealHistory.api.ts`

| 함수         | API                                | 인증   | 설명         |
| ---------- | ---------------------------------- | ---- | ---------- |
| `listMine` | `GET /meal-history/me`             | true | 내 식사 기록 목록 |
| `create`   | `POST /meal-history`               | true | 식사 기록 생성   |
| `update`   | `PATCH /meal-history/{historyId}`  | true | 식사 기록 수정   |
| `remove`   | `DELETE /meal-history/{historyId}` | true | 식사 기록 삭제   |

개인 추천 확정 후에는 `POST /meal-history`를 호출해 식사 기록을 생성한다. 즉, 추천 결과를 보는 것만으로 식사 기록이 생성되지는 않는다.

---

### 13.8 `menuInteractions.api.ts`

| 함수         | API                               | 인증   | 설명                      |
| ---------- | --------------------------------- | ---- | ----------------------- |
| `listMine` | `GET /menu-interactions/me`       | true | 내 메뉴별 좋아요/싫어요/북마크 상태 조회 |
| `create`   | `POST /menu-interactions`         | true | 메뉴 행동 로그 생성             |
| `setState` | `PUT /menu-interactions/{menuId}` | true | 좋아요/싫어요/북마크 상태 설정       |

지원 interaction type:

```ts id="ujmua4"
type MenuInteractionType =
  | "view"
  | "like"
  | "pick"
  | "dislike"
  | "bookmark";

type ToggleableMenuInteractionType =
  | "like"
  | "dislike"
  | "bookmark";
```

상태 모델:

```ts id="xx7ds2"
type MenuInteractionState = {
  menuId: number;
  preference: "like" | "dislike" | null;
  bookmarked: boolean;
};
```

규칙:

* 좋아요/싫어요/북마크 UI는 `setState`를 사용한다.
* `selected: true`이면 선택 상태로 변경한다.
* `selected: false`이면 선택 해제한다.
* 좋아요와 싫어요는 동시에 활성화되지 않는다.
* 북마크는 좋아요/싫어요와 별개로 유지될 수 있다.

---

## 14. Backend 응답과 UI 모델 매핑

현재 backend 응답과 화면 표시 모델 변환은 `domain/mapper` 계층에서 처리한다.

역할:

* master data → 선택 UI item
* menu API → menu option
* meeting purpose API → select option
* users API → participant option
* recommendation API → ranking item
* meetings API → meeting card/detail model
* meal-history API → history card model
* menu interaction API → history/recommendation item interaction state

원칙:

* view 컴포넌트는 backend 원본 응답 구조에 직접 의존하지 않는다.
* API 응답의 snake_case/camelCase 차이는 mapper 또는 API module 경계에서 흡수한다.
* nullable 필드는 mapper에서 안전하게 기본값을 정리한다.
* `any` 사용은 backend 응답 호환이 필요한 mapper 경계에 한정한다.

---

## 15. Initial Data Loading 계약

로그인 또는 세션 복원 후 앱은 초기 데이터를 로딩한다.

초기 로딩 대상:

```text id="0fb2ib"
master data
preferences
user preferences
user profile
meetings
meal history
```

처리 위치:

```text id="9xmp8q"
app/model/useInitialApiData.ts
app/model/useMasterData.ts
```

기준:

* master data는 비로그인 상태에서도 일부 필요하므로 먼저 로딩할 수 있다.
* 사용자 인증이 필요한 데이터는 token 확보 후 로딩한다.
* master data API가 실패하거나 빈 배열을 반환하면 fallback data를 사용할 수 있다.
* 사용자 저장/확정/추천 성공처럼 보여야 하는 데이터는 fallback으로 대체하지 않는다.

---

## 16. Fallback Data 기준

fallback data는 `frontend/src/data.ts`에 있다.

허용 범위:

* 로컬 개발
* 초기 화면 렌더링
* master data API 장애 시 최소 UI 유지
* 온보딩 선택지의 임시 표시

금지 범위:

* 실제 추천 결과를 mock ranking으로 성공처럼 표시
* backend 실패를 숨기고 저장/확정이 된 것처럼 표시
* 식사 기록 생성/수정/삭제 성공을 fallback으로 위장
* 모임 생성/추천/확정 성공을 fallback으로 위장

---

## 17. Loading / Error / Empty 기준

| 상태      | UI 기준                                              |
| ------- | -------------------------------------------------- |
| loading | 버튼 disabled, `LoadingOverlay`, 필요한 경우 loading text |
| error   | 화면 상단 또는 관련 패널에 메시지 표시                             |
| empty   | 빈 상태 문구와 다음 액션 제공                                  |
| success | toast 또는 화면 상태 전환                                  |

원칙:

* API 에러를 `console.error`만 남기고 끝내지 않는다.
* 사용자가 다음에 무엇을 해야 하는지 알 수 있어야 한다.
* 저장, 삭제, 확정 액션 중에는 중복 클릭을 막는다.
* 추천 생성이나 메뉴 확정처럼 시간이 걸리는 액션은 전역 loading을 사용할 수 있다.

---

## 18. 개인 추천 상태 계약

개인 추천 흐름:

```text id="wy5zcp"
추천 조건 입력
-> POST /recommendations/personal
-> recommendationItems 갱신
-> 사용자가 후보 선택
-> 최종 확정
-> POST /meal-history
-> historyItems 갱신
```

규칙:

* 추천 요청 전에는 랭킹을 확정 상태처럼 보이지 않는다.
* 개인 추천 기본 요청은 `recommendationsApi.createPersonal`을 사용한다.
* 개인 추천 결과는 React state와 `appUiStateStorage`에 일부 저장해 새로고침 복원을 지원한다.
* 메뉴별 즉시 기록 버튼은 사용하지 않는다.
* 최종 확정 이후에만 식사 기록이 생성된다.
* 확정된 추천 메뉴는 식사 기록 목록에도 반영한다.
* 선택된 추천 메뉴는 URL query `selectedMenuId`로 복원할 수 있다.

---

## 19. 모임 추천 상태 계약

모임 추천 흐름:

```text id="uz22cj"
모임 상세 진입
-> GET /meetings/{meetingId}
-> 구성원 포함/제외 선택
-> POST /meetings/{meetingId}/recommendations
-> ranking 표시
-> 후보 선택
-> PATCH /meetings/{meetingId}/selected-menu
```

`participantUserIds`는 추천 계산에 포함할 구성원의 `userId` 목록이다. 제외된 구성원은 이 배열에서 빠진다.

규칙:

* 모임 상세 진입 시 `meetingsApi.get`으로 최신 상태를 가져온다.
* 모임 추천 생성은 `meetingsApi.createRecommendation`을 사용한다.
* 최신 추천 결과 조회는 `meetingsApi.getLatestRecommendation`을 사용한다.
* 추천 후보 선택 상태는 React state와 URL query `recommendationMenuId`로 관리한다.
* 메뉴 확정은 `meetingsApi.selectMenu`를 사용한다.
* 게스트는 추천 결과 확인만 가능하다.
* 메뉴 확정은 모임 생성자만 가능하다.
* 메뉴 확정 후 게스트 계정 정리는 backend가 담당한다.
* 모임 상세는 필요 시 polling으로 최신 상태를 동기화한다.

---

## 20. 식사 기록 상태 계약

식사 기록 흐름:

```text id="lx84m4"
GET /meal-history/me
-> historyItems 갱신
-> 수정/삭제/상호작용 토글
-> local display state 반영
```

규칙:

* 식사 기록 목록은 `mealHistoryApi.listMine`으로 조회한다.
* 새 식사 기록은 `mealHistoryApi.create`로 생성한다.
* 기존 식사 기록 수정은 `mealHistoryApi.update`를 사용한다.
* 삭제는 `mealHistoryApi.remove`를 사용한다.
* 수정/삭제 성공 후 화면 상태를 즉시 반영한다.
* 메뉴 좋아요/싫어요/북마크 토글은 `menuInteractionsApi.setState`를 사용한다.
* 상호작용 토글 성공 후 해당 history item의 interaction state를 갱신한다.

---

## 21. 선호도 상태 계약

선호도 저장 흐름:

```text id="4xyrva"
카테고리/태그/알러지/점수/예산 선택
-> buildCurrentPreferencePayload()
-> PUT /preferences/me
-> PUT /user-preferences
-> 상태 갱신
-> toast 표시
```

관리 상태:

| 상태                    | 설명              |
| --------------------- | --------------- |
| `selectedCategories`  | 선택된 카테고리        |
| `selectedTags`        | 선택된 태그          |
| `selectedAllergies`   | 선택된 알러지/제한 조건   |
| `categoryScores`      | 카테고리별 선호 점수     |
| `tagScores`           | 태그별 선호 점수       |
| `recentDuplicateDays` | 최근 식사 중복 패널티 기간 |
| `budgetMin`           | 예산 하한           |
| `budgetMax`           | 예산 상한           |

현재 UI에서는 `budgetLevel`이 단일 값이면 `budgetMin`과 `budgetMax`를 같은 값으로 설정한다.

```text id="6hssyn"
budgetLevel = budgetMin !== null && budgetMin === budgetMax ? budgetMin : null
```

---

## 22. 게스트 세션 상태 계약

게스트 흐름:

```text id="b7nftg"
POST /auth/guest
-> access token 저장
-> session meta 저장
-> 선호도 입력
-> 모임 preview
-> POST /meetings/{meetingId}/join
-> meeting tab 고정
```

규칙:

* 게스트도 backend API 인증을 위해 access token을 가진다.
* 게스트의 실제 모임 표시 이름은 `sessionStorageMeta.displayName`과 `meeting_participants.display_name`에 저장한다.
* 게스트 세션에서는 profile/home/history 등 전체 앱 탐색보다 모임 화면 중심으로 제한한다.
* 메뉴 확정은 모임 생성자만 가능하므로 게스트 UI에서는 확정 액션을 제공하지 않는다.
* 로그아웃 또는 세션 만료 시 게스트 session meta를 삭제한다.

---

## 23. OAuth 상태 계약

Google OAuth 흐름:

```text id="xsug34"
OAuth start
-> Supabase OAuth
-> callback token parsing
-> authSessionStorage 저장
-> POST /auth/profile
-> 닉네임이 필요하면 OAuth onboarding
-> app 진입
```

규칙:

* Supabase anon/publishable key만 프론트에 둔다.
* service role key는 프론트에 절대 두지 않는다.
* OAuth 이후 public user profile이 없거나 닉네임 입력이 필요하면 온보딩 flow로 보낸다.
* OAuth 닉네임 완료 후 `POST /auth/profile`로 backend profile sync를 수행한다.

---

## 24. QA 체크리스트

### 24.1 API base URL

* `VITE_API_BASE_URL`이 올바른지 확인한다.
* backend가 꺼졌을 때 JSON parsing error가 아니라 설정 안내 메시지가 나오는지 확인한다.
* 배포 환경에서 `/api/v1`이 HTML을 반환하지 않는지 확인한다.

### 24.2 인증/세션

* 로그인 후 access token, refresh token, expiresAt이 저장되는지 확인한다.
* refresh token이 있을 때 만료 전 자동 refresh가 되는지 확인한다.
* 여러 API 요청이 동시에 발생해도 refresh 요청이 중복으로 여러 번 나가지 않는지 확인한다.
* refresh 실패 시 세션이 정리되고 시작 화면으로 돌아가는지 확인한다.
* 로그아웃 시 token, session meta, app UI state가 삭제되는지 확인한다.

### 24.3 URL/UI 복원

* `/recommendations/personal?selectedMenuId={id}` 새로고침 시 선택된 개인 추천 메뉴가 복원되는지 확인한다.
* `/meetings/{meetingId}` 새로고침 시 모임 상세가 복원되는지 확인한다.
* `/meetings/{meetingId}?recommendationMenuId={id}` 새로고침 시 선택된 모임 추천 메뉴가 복원되는지 확인한다.
* 뒤로가기/앞으로가기 시 tab과 선택 상태가 적절히 바뀌는지 확인한다.

### 24.4 기능별 상태

* 개인 추천 확정 시 식사 기록이 생성되는지 확인한다.
* 추천 결과 조회만으로는 식사 기록이 생성되지 않는지 확인한다.
* 식사 기록 수정/삭제 후 화면 상태가 즉시 반영되는지 확인한다.
* 좋아요/싫어요/북마크 토글 후 상태가 유지되는지 확인한다.
* 좋아요와 싫어요가 동시에 켜지지 않는지 확인한다.
* 모임 추천에서 제외한 구성원이 `participantUserIds`에서 빠지는지 확인한다.
* 게스트가 메뉴 확정을 시도할 수 없는지 확인한다.
* 모임 생성자가 메뉴 확정 후 상태가 `DECIDED`로 바뀌는지 확인한다.

---

## 25. 설계 요약

현재 프론트엔드는 모든 API 호출을 `apiRequest`로 통합한다. `apiRequest`는 API base URL, JSON 응답 검증, 인증 header, access token refresh, 401 재시도, 세션 만료 처리를 담당한다. 인증 정보는 `localStorage`에 access token, refresh token, expiresAt 형태로 저장하고, 게스트 여부와 모임 참여 정보는 session meta로 저장한다.

앱 화면 복원은 URL state와 `appUiStateStorage`를 함께 사용한다. URL은 현재 tab, 모임 상세, 선택된 추천 메뉴를 표현하는 대표 상태이고, localStorage는 새로고침 후 개인 추천 결과 등 부족한 화면 정보를 복원하는 보조 상태이다.

API 모듈은 endpoint 호출만 담당하고, backend 응답을 화면 표시 모델로 바꾸는 작업은 `domain/mapper`와 feature hook 계층에서 처리한다. 추천, 모임, 식사 기록, 메뉴 상호작용, 예산 조건은 각각 별도 API 모듈과 feature hook을 통해 관리한다.