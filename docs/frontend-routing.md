# MUK PICK Frontend Routing and Navigation

## 1. 목적

이 문서는 MUK PICK 프론트엔드의 화면 이동 기준을 정의한다. 현재 구현은 모바일 앱처럼 `App.tsx` 내부 상태로 화면을 전환하되, 새로고침/뒤로가기/공유를 위해 주요 화면 상태를 URL과 동기화한다.

## 2. 현재 활성 라우팅 기준

현재 활성 기준은 `frontend/src/main.tsx`에서 렌더링하는 `App`이다.

```text
main.tsx -> App.tsx
```

`BrowserRouter`와 `AppRouter`는 현재 진입점에서 사용하지 않는다. `frontend/src/routes/AppRouter.tsx`는 제거되었고, URL 처리는 `frontend/src/app/appNavigation.ts`와 `App.tsx`가 담당한다.

## 3. 활성 URL 계약

React Router route tree가 아니라 활성 모바일 shell의 상태를 path/query로 표현한다.

| URL | 화면/상태 | 기준 |
|---|---|---|
| `/` | 시작 또는 복원 기본값 | 비로그인 시작, 로그인 후 기본 홈 |
| `/home` | 홈 탭 | 회원 |
| `/login` | 이메일 로그인 flow | 비로그인 |
| `/signup` | 이메일/비밀번호/닉네임 회원가입 flow | 비로그인 |
| `/guest` | 게스트 시작 flow | 비로그인 |
| `/preferences` | 선호도 관리 탭 | 회원 |
| `/recommendations/personal` | 개인 추천 탭 | 회원 |
| `/recommendations/personal?selectedMenuId={menuId}` | 개인 추천 후보 선택 복원 | 회원, 최근 추천 리스트 localStorage 복원 |
| `/meetings` | 모임 목록 탭 | 회원 |
| `/meetings/{meetingId}` | 모임 상세 | 회원 또는 참여 게스트 |
| `/meetings/{meetingId}?recommendationMenuId={menuId}` | 모임 추천 후보 선택 복원 | 서버 latest recommendation 재조회 |
| `/history` | 식사 기록 탭 | 회원 |
| `/profile` | 프로필 탭 | 회원 |
| `/me` | 프로필 탭 호환 URL | 회원 |

## 4. 현재 모바일 앱 Flow

`App.tsx`의 `flow` 상태가 인증/온보딩 화면을 제어한다.

| Flow | 의미 | 주요 진입 |
|---|---|---|
| `start` | 시작 화면 | 최초 방문, 로그아웃 |
| `login` | 이메일 로그인 | `/login`, 시작 화면 로그인 |
| `signup-name` | 이메일 회원가입 입력 | 일반 회원가입 시작 |
| `signup-email-sent` | 이메일 인증 안내 | 일반 회원가입 요청 후 |
| `oauth-nickname` | 소셜 로그인 신규 사용자 닉네임 입력 | OAuth callback 후 선호도 없음 |
| `signup-categories` | 회원 카테고리 선호 입력 | 이메일 인증 로그인 후 또는 OAuth 닉네임 저장 후 |
| `signup-tags` | 회원 태그 선호 입력 | 카테고리 다음 |
| `signup-allergies` | 회원 알러지 입력 | 태그 다음 |
| `signup-recent-penalty` | 최근 식사 패널티 입력 | 알러지 다음 |
| `signup-complete` | 회원 온보딩 완료 | 선호도 저장 후 |
| `guest-categories` | 게스트 카테고리 선호 입력 | 게스트 시작 |
| `guest-tags` | 게스트 태그 선호 입력 | 카테고리 다음 |
| `guest-allergies` | 게스트 알러지 입력 | 태그 다음 |
| `guest-join-meeting` | 모임 ID 입력 | 게스트 선호도 완료 후 |
| `guest-display-name` | 모임 확인 후 표시 이름 입력 | meeting preview 성공 후 |
| `app` | 메인 앱 탭 UI | 로그인/가입/게스트 참여 완료 |

## 5. 메인 탭 구조

`flow = app`일 때 `activeTab`이 하단 네비게이션 화면을 제어한다.

| Tab | 화면 | 권한 |
|---|---|---|
| `home` | 홈 | 회원 |
| `meeting` | 모임 목록/상세 | 회원, 게스트 제한 접근 |
| `profile` | 프로필 | 회원 |
| `preferences` | 선호도 관리 | 회원 |
| `personal` | 개인 추천 | 회원 |
| `history` | 식사 기록 | 회원 |

현재 하단 네비게이션에는 `meeting`, `home`, `profile`이 노출된다. 나머지 탭은 카드/버튼 액션으로 진입한다.

## 6. 사용자 유형별 접근 기준

| 화면/액션 | 회원 | 게스트 |
|---|---:|---:|
| 시작 화면 | 가능 | 가능 |
| 회원 온보딩 | 가능 | 불가 |
| 게스트 온보딩 | 가능 | 가능 |
| 홈 | 가능 | 제한 |
| 개인 추천 | 가능 | 불가 |
| 식사 기록 | 가능 | 불가 |
| 선호도 관리 | 가능 | 게스트 세션에서는 제한 |
| 모임 ID 입력 | 가능 | 가능 |
| 모임 preview | 가능 | 가능 |
| 모임 참여 | 가능 | 가능 |
| 모임 상세 조회 | 참여 모임 가능 | 참여 모임 가능 |
| 모임 추천 계산 | 모임 생성자 중심 | 제한 |
| 모임 메뉴 확정 | 모임 생성자만 가능 | 불가 |
| 모임 목록 이동 | 가능 | 게스트는 제한 |

게스트는 특정 모임 참여를 목적으로 하는 임시 사용자이다. 게스트에게 일반 회원의 탐색형 화면을 열어주지 않는다.

## 7. 핵심 이동 시나리오

### 7.1 회원 시작

```text
start
-> signup-name
-> signup-categories
-> signup-tags
-> signup-allergies
-> signup-recent-penalty
-> signup-complete
-> app/home
```

### 7.2 기존 회원

```text
start
-> 이메일 로그인 또는 OAuth callback
-> app/home
```

기존 회원은 이메일/비밀번호 로그인 또는 Google OAuth로 진입한다. OAuth 시작은 `@supabase/supabase-js`의 `signInWithOAuth()`를 사용한다.

소셜 로그인 신규 사용자는 이메일/비밀번호를 다시 입력하지 않는다. OAuth callback으로 세션을 받은 뒤 `oauth-nickname`에서 닉네임만 입력하고, 이후 동일한 선호도 조사 흐름으로 이동한다.

```text
start
-> OAuth callback
-> oauth-nickname
-> signup-categories
-> signup-tags
-> signup-allergies
-> signup-recent-penalty
-> signup-complete
-> app/home
```

OAuth는 Supabase provider, Supabase Redirect URLs allowlist, Google Cloud OAuth 설정이 배포 URL과 일치해야 실제 성공한다. Google Cloud Console에는 프론트 URL이 아니라 Supabase callback URL인 `https://{project-ref}.supabase.co/auth/v1/callback`을 OAuth redirect URI로 등록한다.

### 7.3 게스트 모임 참여

```text
start
-> guest-categories
-> guest-tags
-> guest-allergies
-> guest-join-meeting
-> guest-display-name
-> app/meeting detail
```

게스트는 최근 식사 기록이 없으므로 `recentDuplicateDays` 설정을 받지 않는다.

### 7.4 개인 추천

```text
app/home
-> personal
-> 추천 조건 입력
-> 추천 요청
-> 랭킹 표시
-> 후보 선택
-> 최종 확정
-> meal-history 생성
```

### 7.5 모임 추천

```text
app/meeting
-> 모임 생성 또는 모임 상세
-> 구성원 확인
-> 구성원 포함/제외 선택
-> 추천 계산
-> 랭킹 표시
-> 후보 선택
-> 모임 생성자 최종 확정
```

## 8. 새로고침 복원 기준

| 데이터 | 복원 여부 | 기준 |
|---|---:|---|
| access token | 복원 | `authSessionStorage.accessToken` |
| refresh token | 복원 | `authSessionStorage.refreshToken` |
| access token 만료 | 복구 | 만료 전 또는 401 응답 시 `POST /auth/refresh` |
| 게스트 여부 | 복원 | `sessionStorageMeta.isGuest` |
| 게스트 모임 ID | 복원 | `sessionStorageMeta.meetingId` |
| 게스트 표시 이름 | 복원 | `sessionStorageMeta.displayName` |
| active tab | 복원 | URL path 우선, 없으면 `appUiStateStorage.activeTab` |
| 개인 추천 리스트 | 복원 | `appUiStateStorage.personalRecommendations` |
| 개인 추천 선택 후보 | 복원 | `selectedMenuId` query 우선, 없으면 `appUiStateStorage.selectedPersonalMenuId` |
| 모임 상세 | 복원 | `/meetings/{meetingId}` 또는 게스트 `sessionStorageMeta.meetingId` |
| 모임 추천 선택 후보 | 복원 | `recommendationMenuId` query 우선, 없으면 `appUiStateStorage.selectedMeetingMenuId` |

## 9. 뒤로가기와 공유 URL

상태 변경 시 `history.pushState`로 URL을 갱신하고, `popstate`에서 URL을 다시 `App.tsx` 상태로 적용한다.

- 탭 이동은 `/home`, `/meetings`, `/profile`, `/preferences`, `/recommendations/personal`, `/history`로 반영한다.
- 모임 상세는 `/meetings/{meetingId}`로 공유 가능하다.
- 모임 추천 후보 선택은 `recommendationMenuId` query로 반영한다.
- 개인 추천 후보 선택은 `selectedMenuId` query로 반영한다.
- 비로그인 상태에서 `/login`, `/signup`, `/guest`로 직접 진입할 수 있다.

향후 완전한 React Router 전환이 필요해도 기존 `AppRouter`를 부활시키지 않고, 이 URL 계약을 기준으로 route tree를 새로 설계한다.
