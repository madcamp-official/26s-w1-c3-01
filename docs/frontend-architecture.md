# MUK PICK Frontend Architecture

## 1. 목적

이 문서는 React + Vite 기반 MUK PICK 프론트엔드의 현재 구현 기준을 정의한다. 기능명세서가 사용자 관점의 요구사항을 설명한다면, 이 문서는 프론트엔드 개발자가 코드 작업 전에 알아야 하는 구조, 책임 분리, 상태 관리, API 연동, URL 동기화, 검증 기준을 다룬다.

현재 프론트엔드는 초기의 단일 `App.tsx` 중심 구조에서 벗어나, `MukpickApp`이 앱 흐름과 feature hook을 조립하고 `AppScreens`가 실제 화면 컴포넌트를 렌더링하는 구조로 분리되어 있다.

---

## 2. 현재 기술 스택

| 영역             | 기준                                                    |
| -------------- | ----------------------------------------------------- |
| Framework      | React 19 + Vite                                       |
| Language       | TypeScript                                            |
| Styling        | `frontend/src/styles.css` 단일 CSS 중심                   |
| Icon           | `lucide-react`                                        |
| API            | Express backend `/api/v1`                             |
| Auth           | Supabase Auth access token, refresh token 기반          |
| State          | React state + localStorage + URL state                |
| Routing        | React Router 미사용, 자체 URL state sync 사용                |
| Code Splitting | `React.lazy`, `Suspense` 기반 feature view lazy loading |

---

## 3. 현재 렌더링 진입점

현재 실제 렌더링 진입점은 `frontend/src/main.tsx`이다.

```tsx id="e9ek6i"
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`frontend/src/App.tsx`는 더 이상 화면과 상태를 직접 구현하지 않는다. 현재 `App.tsx`는 `MukpickApp`만 렌더링하는 얇은 wrapper 역할을 한다.

```tsx id="3h47s4"
import { MukpickApp } from "./app/MukpickApp";

export function App() {
  return <MukpickApp />;
}
```

기존 React Router 기반 구조가 있었다면 현재 기준에서는 사용하지 않는다. 새 작업의 기준은 `frontend/src/app/MukpickApp.tsx`, `frontend/src/app/routes/AppScreens.tsx`, `frontend/src/app/appNavigation.ts`, `frontend/src/app/useAppUrlSync.ts`이다.

---

## 4. 현재 폴더 구조

```text id="kz0oi7"
frontend/src/
├─ main.tsx                         # React app mount
├─ App.tsx                          # MukpickApp을 렌더링하는 thin wrapper
├─ styles.css                       # 전체 UI 스타일
├─ assets.ts                        # Supabase/public asset URL mapping
├─ data.ts                          # fallback master data
├─ api/                             # backend API wrapper
├─ app/                             # 앱 shell, URL sync, 전역 orchestration
│  ├─ MukpickApp.tsx                # 앱 흐름과 feature hook 조립
│  ├─ app.types.ts                  # Flow, Tab 등 앱 전역 타입
│  ├─ appNavigation.ts              # URL <-> app state 변환
│  ├─ appUtils.ts                   # 앱 공통 유틸
│  ├─ useAppUrlSync.ts              # URL과 UI 상태 동기화
│  ├─ model/                        # bootstrap, master data, route restore, toast 등 앱 모델 hook
│  └─ routes/
│     ├─ appRoutes.ts               # 앱 경로 상수
│     └─ AppScreens.tsx             # 화면 lazy loading 및 탭별 view 조립
├─ components/                      # 공통 UI 컴포넌트
│  ├─ feedback/                     # LoadingOverlay 등 피드백 UI
│  └─ layout/                       # AppLayout 등 레이아웃
├─ domain/
│  └─ mapper/                       # backend 응답 -> 화면 표시 모델 변환
├─ features/
│  ├─ auth/                         # 로그인, 회원가입, 게스트, OAuth 온보딩 흐름
│  ├─ home/                         # 홈 화면
│  ├─ mealHistory/                  # 식사 기록 화면과 액션
│  ├─ meetings/                     # 모임 목록, 상세, 생성, 추천, 확정
│  ├─ preferences/                  # 선호도 설정/저장
│  ├─ profile/                      # 프로필 화면
│  └─ recommendations/              # 개인 추천 화면과 액션
├─ types/                           # API 공통 타입
└─ utils/
   └─ storage.ts                    # auth/session/UI state localStorage 캡슐화
```

---

## 5. 레이어 구조

현재 프론트엔드는 아래와 같은 흐름으로 동작한다.

```text id="f332bu"
main.tsx
  -> App.tsx
    -> app/MukpickApp.tsx
      -> app/routes/AppScreens.tsx
        -> features/* View
          -> components/*
```

API와 상태 흐름은 다음과 같다.

```text id="7o6lzk"
features/* action hook
  -> api/*
    -> api/client.ts apiRequest()
      -> backend /api/v1
        -> Supabase
```

화면 데이터 변환 흐름은 다음과 같다.

```text id="loxupn"
backend response
  -> api/*
    -> domain/mapper
      -> feature hook state
        -> feature view props
```

---

## 6. 주요 파일별 책임

### 6.1 `main.tsx`

React 앱을 DOM에 mount한다.

책임:

* `ReactDOM.createRoot` 호출
* `App` 렌더링
* 전역 CSS import

---

### 6.2 `App.tsx`

현재는 `MukpickApp`만 렌더링하는 wrapper이다.

책임:

* 앱 루트 컴포넌트 연결
* 직접적인 화면 상태, API 호출, UI 렌더링을 갖지 않음

---

### 6.3 `app/MukpickApp.tsx`

현재 앱의 핵심 orchestration 컴포넌트이다.

책임:

* 앱 흐름 상태 관리

  * 시작 화면
  * 로그인
  * 회원가입
  * 게스트 온보딩
  * OAuth 온보딩
  * 실제 앱 화면
* feature hook 조립

  * 인증
  * 세션 복원
  * 선호도 설정
  * master data 로딩
  * 개인 추천
  * 식사 기록
  * 모임
  * URL 동기화
  * toast
* feature action handler 연결
* 전역 loading 상태 계산
* 인증 세션 만료 처리
* `AuthFlow` 또는 `AppScreens` 중 현재 flow에 맞는 화면 렌더링
* `LoadingOverlay` 전역 표시

`MukpickApp`은 화면 JSX를 직접 많이 들고 있기보다는 feature hook과 화면 container를 연결하는 조립 계층이다.

---

### 6.4 `app/routes/AppScreens.tsx`

앱 내부 화면을 탭 상태에 따라 렌더링하는 화면 조립 컴포넌트이다.

책임:

* `HomeView`
* `PreferencesView`
* `PersonalView`
* `MeetingView`
* `HistoryView`
* `ProfileView`
* `MeetingCreateDialog`

위 화면들을 `React.lazy`로 lazy loading한다.

`AppScreens`는 `AppLayout` 안에서 현재 `visibleTab`에 맞는 feature view만 렌더링한다. 화면 전환은 React Router가 아니라 `visibleTab` 상태와 URL sync를 통해 처리된다.

---

### 6.5 `app/appNavigation.ts`

URL과 앱 상태 사이의 변환 규칙을 담당한다.

책임:

* 현재 URL에서 앱 route state 읽기
* 앱 상태를 URL path/query로 변환
* 선택된 개인 추천 메뉴 ID 읽기
* 선택된 모임 추천 메뉴 ID 읽기
* 모임 상세 ID 읽기

지원하는 주요 경로:

```text id="xmucwn"
/
 /login
/signup
/guest
/home
/preferences
/recommendations/personal
/meetings
/meetings/{meetingId}
/history
/profile
/me
```

`/me`는 profile tab으로 처리한다.

---

### 6.6 `app/routes/appRoutes.ts`

앱에서 사용하는 경로 상수를 정의한다.

```ts id="kbbepq"
export const appRoutes = {
  start: "/",
  login: "/login",
  signup: "/signup",
  guest: "/guest",
  home: "/home",
  preferences: "/preferences",
  personalRecommendations: "/recommendations/personal",
  meetings: "/meetings",
  meetingDetail: (meetingId: number) => `/meetings/${meetingId}`,
  history: "/history",
  profile: "/profile"
} as const;
```

---

### 6.7 `app/useAppUrlSync.ts`

React state와 browser URL을 동기화한다.

책임:

* 앱 상태가 바뀌면 `window.history.pushState`로 URL 갱신
* 뒤로가기/앞으로가기 발생 시 `popstate`를 감지해 route state 복원
* 앱 UI 상태를 `appUiStateStorage`에 저장
* 선택된 모임, 선택된 개인 추천 메뉴, 선택된 모임 추천 메뉴를 URL query와 localStorage에 반영

URL이 대표 상태이고, 새로고침 복원을 위해 localStorage를 보조 상태로 사용한다.

---

### 6.8 `utils/storage.ts`

localStorage 접근을 캡슐화한다.

저장 항목:

| 저장 항목         | key                    | 설명                                 |
| ------------- | ---------------------- | ---------------------------------- |
| access token  | `mukpick.accessToken`  | API 인증에 사용                         |
| refresh token | `mukpick.refreshToken` | access token 갱신에 사용                |
| expires at    | `mukpick.expiresAt`    | token refresh 필요 여부 판단             |
| session meta  | `mukpick.session`      | 게스트 여부, 모임 ID, displayName         |
| app UI state  | `mukpick.appUiState`   | active tab, 선택된 모임/추천, 개인 추천 결과 복원 |

`sessionStorageMeta`라는 이름을 사용하지만 실제 저장 위치는 `sessionStorage`가 아니라 `localStorage`이다. 이름은 기존 코드 호환을 위해 유지하고, 의미상으로는 세션 관련 메타데이터 저장소로 이해한다.

---

### 6.9 `api/client.ts`

모든 백엔드 API 요청의 공통 클라이언트이다.

책임:

* `VITE_API_BASE_URL` 또는 기본값 `/api/v1` 사용
* `Content-Type: application/json` 설정
* 인증 요청에 `Authorization: Bearer {accessToken}` 추가
* access token 만료 전 refresh token으로 갱신
* 401 발생 시 refresh 후 1회 재시도
* refresh 중복 요청 방지를 위해 `refreshPromise` 사용
* API 응답이 JSON이 아닌 경우 backend URL 또는 배포 환경변수 문제로 안내
* API 공통 응답 형식 `{ success, data, error }` 처리
* 세션 만료 시 저장된 인증 상태 정리

---

## 7. Feature 단위 구조

### 7.1 `features/auth`

인증과 온보딩 흐름을 담당한다.

주요 역할:

* 로그인
* 이메일 회원가입
* 회원가입 이메일 재전송
* 닉네임 중복 확인
* Google OAuth 시작
* OAuth 닉네임 온보딩 완료
* 게스트 선호도 입력 완료
* 게스트 모임 preview 및 join 준비
* 세션 복원
* 프로필 정보 적용

주요 파일 예시:

```text id="eees78"
features/auth/AuthFlow.tsx
features/auth/useAuthActions.ts
features/auth/useAuthFlowState.ts
features/auth/useAuthProfile.ts
features/auth/useSessionRestore.ts
```

---

### 7.2 `features/preferences`

사용자 선호도 설정과 저장을 담당한다.

주요 역할:

* 카테고리 선택
* 태그 선택
* 알러지/제한 조건 선택
* 카테고리 선호 점수 관리
* 태그 선호 점수 관리
* 최근 식사 중복 패널티 기간 관리
* 예산 조건 관리
* 현재 선호도 payload 생성
* backend 저장 요청 실행

주요 파일 예시:

```text id="hvhy26"
features/preferences/PreferencesView.tsx
features/preferences/usePreferenceSettings.ts
features/preferences/usePreferenceSaveAction.ts
```

---

### 7.3 `features/recommendations`

개인 메뉴 추천 화면과 액션을 담당한다.

주요 역할:

* 개인 추천 결과 상태 관리
* 개인 추천 재조회
* 추천 결과 선택
* 개인 추천 확정
* 확정된 추천 메뉴를 식사 기록으로 저장
* 추천 결과 복원

주요 파일 예시:

```text id="xzluja"
features/recommendations/PersonalView.tsx
features/recommendations/usePersonalRecommendations.ts
features/recommendations/usePersonalRecommendationActions.ts
```

---

### 7.4 `features/meetings`

모임 생성, 모임 목록, 모임 상세, 모임 추천, 메뉴 확정을 담당한다.

주요 역할:

* 모임 생성
* 모임 목록 조회
* 모임 상세 열기
* 게스트 모임 preview
* 게스트 모임 join
* 모임 참여자 포함/제외 선택
* 모임 추천 생성
* 모임 추천 결과 선택
* 최종 메뉴 확정
* 모임 정보 수정
* 모임 상세 polling
* 게스트 세션 동기화

주요 파일 예시:

```text id="wrwa7q"
features/meetings/MeetingView.tsx
features/meetings/MeetingCreateDialog.tsx
features/meetings/useMeetings.ts
features/meetings/useMeetingActions.ts
features/meetings/useMeetingSessionSync.ts
features/meetings/useSelectedMeetingPolling.ts
```

---

### 7.5 `features/mealHistory`

식사 기록 화면과 액션을 담당한다.

주요 역할:

* 식사 기록 목록 조회
* 식사 기록 생성
* 식사 기록 수정
* 식사 기록 삭제
* 메뉴 좋아요/싫어요/북마크 토글
* 식사 기록 표시 모델 변환

주요 파일 예시:

```text id="z7r4t6"
features/mealHistory/HistoryView.tsx
features/mealHistory/MealHistoryDialog.tsx
features/mealHistory/useMealHistories.ts
features/mealHistory/useMealHistoryActions.ts
```

---

### 7.6 `features/home`

홈 화면을 담당한다.

주요 역할:

* 최근 식사 요약
* 개인 추천 진입
* 모임 생성/모임 추천 진입
* 식사 기록 진입
* 현재 선호도/기록 기반 홈 정보 표시

---

### 7.7 `features/profile`

프로필 화면을 담당한다.

주요 역할:

* 사용자 이름 표시
* 선호도 개수 표시
* 식사 기록 개수 표시
* 선호도 설정 화면 진입
* 로그아웃

---

## 8. Domain Mapper 구조

`domain/mapper`는 backend 응답을 화면 표시 모델로 변환하는 계층이다.

역할:

* backend snake_case/camelCase 혼용 대응
* API 응답의 nullable 필드 처리
* 화면에서 쓰기 쉬운 display model 생성
* 추천 결과, 모임, 식사 기록, master data 변환
* API 응답 호환을 위한 제한적인 `any` 사용 허용

원칙:

* API 호출 함수는 HTTP 요청과 응답 수신까지만 담당한다.
* 화면 컴포넌트는 backend 원본 응답 구조에 직접 의존하지 않는다.
* 화면에서 필요한 이름, 점수, 태그, 상태값은 mapper를 통해 정규화한다.

---

## 9. 상태 관리 기준

현재 별도의 전역 상태 관리 라이브러리는 사용하지 않는다. React state, custom hook, localStorage, URL state를 조합한다.

| 상태                      | 저장 위치                       | 설명                            |
| ----------------------- | --------------------------- | ----------------------------- |
| access token            | `localStorage`              | API 인증에 사용                    |
| refresh token           | `localStorage`              | access token 갱신에 사용           |
| expires at              | `localStorage`              | refresh 필요 여부 판단              |
| session meta            | `localStorage`              | 게스트 여부, 참여 모임 ID, displayName |
| app UI state            | `localStorage`              | active tab, 선택된 추천/모임 상태 복원   |
| active tab              | React state + URL           | 홈/선호도/개인추천/모임/기록/프로필 탭        |
| auth/onboarding flow    | React state + URL           | 시작, 로그인, 회원가입, 게스트, OAuth 온보딩 |
| master data             | React state + fallback data | 카테고리/태그/알러지/메뉴/모임 목적          |
| recommendation result   | React state + localStorage  | 개인 또는 모임 추천 랭킹                |
| selected recommendation | React state + URL           | 최종 확정 전 사용자가 선택한 후보           |
| toast                   | React state                 | 사용자 피드백 메시지                   |
| loading                 | React state                 | 전역 loading overlay 표시         |

새로고침 후 복원이 필요한 상태는 `storage.ts`와 URL을 통해 저장한다. URL이 있으면 URL을 우선하고, URL에 선택 정보가 없으면 `appUiStateStorage`를 fallback으로 사용한다.

---

## 10. URL 상태 동기화 기준

현재 프론트는 React Router를 쓰지 않고 자체 URL 동기화 로직을 사용한다.

### 10.1 URL 읽기

`readAppRoute`는 현재 path와 query를 읽어 앱 상태로 변환한다.

예시:

| URL                                          | 변환 상태                                                    |
| -------------------------------------------- | -------------------------------------------------------- |
| `/login`                                     | `flow: "login"`                                          |
| `/signup`                                    | `flow: "signup-name"`                                    |
| `/guest`                                     | `flow: "guest-categories"`                               |
| `/home`                                      | `tab: "home"`                                            |
| `/preferences`                               | `tab: "preferences"`                                     |
| `/recommendations/personal`                  | `tab: "personal"`                                        |
| `/recommendations/personal?selectedMenuId=3` | `tab: "personal", selectedPersonalMenuId: 3`             |
| `/meetings`                                  | `tab: "meeting"`                                         |
| `/meetings/7`                                | `tab: "meeting", meetingId: 7`                           |
| `/meetings/7?recommendationMenuId=2`         | `tab: "meeting", meetingId: 7, selectedMeetingMenuId: 2` |
| `/history`                                   | `tab: "history"`                                         |
| `/profile`                                   | `tab: "profile"`                                         |
| `/me`                                        | `tab: "profile"`                                         |

### 10.2 URL 쓰기

`buildAppUrl`은 현재 앱 상태를 기준으로 URL을 생성한다.

규칙:

* `flow !== "app"`이면 로그인/회원가입/게스트/시작 URL을 사용한다.
* 게스트 세션이면 항상 meeting tab을 visible tab으로 사용한다.
* 개인 추천에서 선택된 메뉴가 있으면 `selectedMenuId` query를 붙인다.
* 모임 상세에서 선택된 추천 메뉴가 있으면 `recommendationMenuId` query를 붙인다.
* `window.history.pushState`를 사용해 URL을 갱신한다.

### 10.3 뒤로가기/앞으로가기

`popstate` 이벤트를 감지해 현재 URL을 다시 읽고 화면 상태를 복원한다.

---

## 11. API 연동 원칙

### 11.1 공통 원칙

* 모든 API 호출은 `apiRequest`를 거친다.
* 인증이 필요한 요청은 access token을 `Authorization: Bearer`로 전달한다.
* `VITE_API_BASE_URL`이 없으면 기본값 `/api/v1`을 사용한다.
* API가 JSON이 아닌 HTML을 반환하면 사용자에게 backend URL 또는 배포 환경변수 문제로 안내한다.
* 화면은 loading, error, empty, success 상태를 모두 가진다.
* API 응답 필드명 차이는 mapper 또는 API module 경계에서 흡수한다.

### 11.2 인증 갱신 원칙

* access token 만료가 가까우면 요청 전 refresh를 수행한다.
* 401 응답이 발생하고 refresh token이 있으면 refresh 후 1회 재시도한다.
* refresh 요청이 동시에 여러 번 발생하지 않도록 `refreshPromise`로 하나의 갱신 작업만 공유한다.
* refresh 실패 시 access token, refresh token, expiresAt, session meta를 정리한다.
* 세션 만료는 `AuthSessionExpiredError`로 표현하고, 앱은 시작 화면으로 돌아간다.

---

## 12. 화면 구성 기준

현재 앱은 모바일 앱 형태의 single shell 구조이다.

### 12.1 비로그인/온보딩 흐름

`flow !== "app"`이면 `AuthFlow`를 렌더링한다.

포함 흐름:

* 시작 화면
* 로그인
* 이메일 회원가입
* 이메일 인증 안내
* Google OAuth 닉네임 온보딩
* 게스트 선호도 선택
* 게스트 모임 preview/join

### 12.2 로그인 후 앱 흐름

`flow === "app"`이면 `AppScreens`를 렌더링한다.

탭 구성:

| Tab           | 화면       |
| ------------- | -------- |
| `home`        | 홈        |
| `preferences` | 선호도 설정   |
| `personal`    | 개인 메뉴 추천 |
| `meeting`     | 모임/모임 추천 |
| `history`     | 식사 기록    |
| `profile`     | 프로필      |

게스트 세션에서는 `activeTab`과 관계없이 `visibleTab`을 `meeting`으로 고정한다.

---

## 13. Loading/Toast/Error 처리

### 13.1 Loading

전역 loading 여부는 여러 busy 상태를 합산해 계산한다.

포함 상태:

* `authBusy`
* `apiStatus === "loading"`
* `apiStatus === "authenticating"`
* `meetingSaving`
* `preferenceSaving`
* `personalRecommendationLoading`
* `historySaving`
* `meetingActionLoading`

전역 loading은 `LoadingOverlay`로 표시한다. lazy-loaded 화면을 불러올 때도 `Suspense fallback`으로 `LoadingOverlay`를 사용한다.

### 13.2 Toast

사용자 액션 성공/실패 피드백은 `useToast`를 통해 표시한다.

예시:

* 선호도 저장 완료
* 개인 추천 생성 완료
* 식사 기록 저장 완료
* 모임 생성 완료
* 모임 메뉴 확정 완료
* 로그아웃 완료

### 13.3 Error

API 오류는 다음 방식으로 처리한다.

* 인증 오류: 저장된 세션 정리 후 시작 화면으로 이동
* JSON 아님: backend URL 또는 환경변수 문제 안내
* 일반 API 오류: `apiError` 또는 `authError`로 화면에 표시
* 사용자 액션 실패: toast 또는 error 영역으로 안내

---

## 14. 코드 작업 기준

### 14.1 새 기능 추가 기준

* 새 기능은 가능한 한 `App.tsx`에 추가하지 않는다.
* 전역 흐름 조립이 필요하면 `MukpickApp.tsx`에 최소한의 연결 코드만 추가한다.
* 화면 UI는 `features/{domain}` 하위 view 또는 dialog로 분리한다.
* 업무별 상태와 액션은 feature hook으로 분리한다.
* 반복되는 버튼, 카드, 칩, 입력, 모달은 `components/*`로 분리한다.
* API 응답 변환은 `domain/mapper` 또는 API module 경계에서 처리한다.

### 14.2 feature hook 작성 기준

feature hook은 다음 중 하나의 책임만 갖는다.

* 화면 상태 관리
* API action 처리
* backend 응답을 display state로 반영
* polling/session sync 등 side effect 처리

하나의 hook이 화면 렌더링 JSX를 직접 반환하지 않도록 한다.

### 14.3 API module 작성 기준

* endpoint 호출만 담당한다.
* UI 상태를 직접 수정하지 않는다.
* alert/toast를 직접 호출하지 않는다.
* path, method, body, auth 여부를 명확히 한다.
* 반환값은 가능한 한 타입을 붙인다.

### 14.4 mapper 작성 기준

* backend 응답 필드명 차이를 흡수한다.
* null/undefined 값을 안전하게 처리한다.
* 화면에 필요한 최소 display model을 만든다.
* mapper 경계 외부에서 `any` 사용을 늘리지 않는다.

### 14.5 컴포넌트 작성 기준

* view 컴포넌트는 props를 통해 필요한 상태와 handler를 받는다.
* view 컴포넌트가 직접 API를 호출하지 않도록 한다.
* 공통 컴포넌트는 업무 도메인 지식을 최소화한다.
* 모바일 화면 기준으로 overflow, safe area, 버튼 위치를 확인한다.
* loading, empty, error 상태를 함께 고려한다.

---

## 15. 구현/유지보수 우선순위

현재 구조는 이미 `App.tsx` 단일 책임 문제를 상당 부분 해소했다. 이후 작업은 아래 순서로 진행한다.

1. `MukpickApp.tsx`의 props 연결부가 계속 커지지 않도록 feature별 container를 추가로 분리한다.
2. `AppScreens`의 props 수가 많아지는 경우 tab별 screen container를 둔다.
3. API module과 mapper의 책임 경계를 더 명확히 한다.
4. `styles.css`가 계속 커지는 경우 feature별 CSS 또는 component style section으로 나눈다.
5. legacy route/page 모듈이 남아 있다면 현재 mobile shell과 중복되는지 확인하고 제거 또는 feature view로 이관한다.
6. 반복되는 modal, chip, score card, recommendation card는 공통 컴포넌트로 정리한다.
7. URL 복원과 localStorage 복원 케이스를 QA 체크리스트로 유지한다.

---

## 16. 검증 기준

프론트 수정 후 최소한 아래 항목을 확인한다.

### 16.1 로컬 실행

```bash id="oeq3pe"
cd frontend
npm install
npm run dev
```

### 16.2 빌드 확인

```bash id="2rpkq1"
cd frontend
npm run build
```

### 16.3 주요 플로우 확인

* 시작 화면 진입
* 이메일 로그인
* 이메일 회원가입
* Google OAuth 온보딩
* 게스트 모임 참여
* 선호도 저장
* 개인 추천 조회
* 개인 추천 메뉴 확정 후 식사 기록 생성
* 식사 기록 수정/삭제
* 좋아요/싫어요/북마크 토글
* 모임 생성
* 모임 상세 진입
* 참여자 포함/제외 후 모임 추천 생성
* 모임 추천 메뉴 확정
* 새로고침 후 selected meeting/recommendation 복원
* 뒤로가기/앞으로가기 동작
* 로그아웃 후 세션 정리

---

## 17. 설계 요약

현재 프론트엔드는 `React + Vite + TypeScript` 기반의 모바일 single shell 구조이다. `main.tsx`가 앱을 mount하고, `App.tsx`는 `MukpickApp`만 렌더링한다. `MukpickApp`은 인증, 선호도, 추천, 식사 기록, 모임, URL sync, 세션 복원 hook을 조립하는 orchestration 계층이다. 실제 화면 렌더링은 `AppScreens`가 담당하며, 각 화면은 `features/*` 아래의 lazy-loaded view로 분리되어 있다.

상태 관리는 React state를 기본으로 사용하고, 새로고침 복원이 필요한 인증 세션과 UI 상태는 `localStorage`에 저장한다. URL은 현재 화면, 선택된 모임, 선택된 추천 메뉴를 표현하는 대표 상태로 사용한다. API 호출은 `apiRequest`를 통해 통합 처리하며, access token refresh와 세션 만료 처리를 공통화한다.