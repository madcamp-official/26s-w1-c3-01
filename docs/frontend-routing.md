# MUK PICK Frontend Routing and Navigation

## 1. 목적

이 문서는 MUK PICK 프론트엔드의 화면 이동, URL 표현, 새로고침 복원, 뒤로가기/앞으로가기 처리 기준을 정의한다.

현재 프론트엔드는 React Router를 사용하지 않는다. 대신 모바일 앱처럼 내부 상태로 화면을 전환하고, 공유와 새로고침 복원을 위해 주요 화면 상태를 browser URL과 동기화한다.

현재 라우팅 기준은 다음 파일을 중심으로 한다.

```text id="7tkjz8"
frontend/src/app/MukpickApp.tsx
frontend/src/app/appNavigation.ts
frontend/src/app/useAppUrlSync.ts
frontend/src/app/routes/AppScreens.tsx
frontend/src/utils/storage.ts
```

---

## 2. 현재 활성 라우팅 구조

현재 실제 렌더링 구조는 다음과 같다.

```text id="w04ghx"
main.tsx
  -> App.tsx
    -> MukpickApp.tsx
      -> AppScreens.tsx
        -> features/* View
```

`App.tsx`는 `MukpickApp`만 렌더링하는 wrapper이다. 화면 이동, flow 상태, active tab, URL 동기화는 `App.tsx`가 아니라 `MukpickApp`, `appNavigation.ts`, `useAppUrlSync.ts`에서 처리한다.

현재 구조에서 `BrowserRouter`와 `AppRouter`는 사용하지 않는다. React Router route tree가 아니라 앱 내부 상태를 URL path/query로 표현하는 방식이다.

---

## 3. 라우팅 관련 파일 책임

| 파일                          | 책임                                                           |
| --------------------------- | ------------------------------------------------------------ |
| `app/MukpickApp.tsx`        | 인증 flow, active tab, 선택된 모임/추천 상태 관리 및 URL sync hook 연결      |
| `app/appNavigation.ts`      | 현재 URL을 앱 route state로 변환하고, 앱 state를 URL로 변환                |
| `app/useAppUrlSync.ts`      | 앱 상태 변경 시 `history.pushState` 실행, `popstate` 감지, UI state 저장 |
| `app/routes/AppScreens.tsx` | 현재 `visibleTab`에 맞는 feature view 렌더링                         |
| `app/routes/appRoutes.ts`   | 앱에서 사용하는 path 상수 정의                                          |
| `utils/storage.ts`          | auth session, guest session meta, app UI state 저장/복원         |

---

## 4. URL State 모델

`appNavigation.ts`에서 사용하는 route state는 다음 형태이다.

```ts id="uujivx"
type AppRouteState = {
  flow?: Flow;
  tab?: Tab;
  meetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
};
```

각 필드의 의미는 다음과 같다.

| 필드                       | 설명                      |
| ------------------------ | ----------------------- |
| `flow`                   | 비로그인/온보딩/앱 진입 전 화면 상태   |
| `tab`                    | 앱 내부에서 현재 보여줄 탭         |
| `meetingId`              | 모임 상세 화면에서 선택된 모임 ID    |
| `selectedPersonalMenuId` | 개인 추천 화면에서 선택된 추천 메뉴 ID |
| `selectedMeetingMenuId`  | 모임 추천 화면에서 선택된 추천 메뉴 ID |

---

## 5. 활성 URL 계약

현재 앱은 아래 URL을 기준으로 화면 상태를 표현한다.

| URL                                                   | 화면/상태                  | 기준                            |
| ----------------------------------------------------- | ---------------------- | ----------------------------- |
| `/`                                                   | 시작 또는 복원 기본값           | 비로그인 시작, 로그인 후 기본 홈           |
| `/login`                                              | 이메일 로그인 flow           | 비로그인                          |
| `/signup`                                             | 이메일/비밀번호/닉네임 회원가입 flow | 비로그인                          |
| `/guest`                                              | 게스트 시작 flow            | 비로그인                          |
| `/home`                                               | 홈 탭                    | 회원                            |
| `/preferences`                                        | 선호도 관리 탭               | 회원                            |
| `/recommendations/personal`                           | 개인 추천 탭                | 회원                            |
| `/recommendations/personal?selectedMenuId={menuId}`   | 개인 추천 후보 선택 복원         | 회원, 최근 추천 리스트 localStorage 복원 |
| `/meetings`                                           | 모임 목록 탭                | 회원                            |
| `/meetings/{meetingId}`                               | 모임 상세                  | 회원 또는 참여 게스트                  |
| `/meetings/{meetingId}?recommendationMenuId={menuId}` | 모임 추천 후보 선택 복원         | 서버 latest recommendation 재조회  |
| `/history`                                            | 식사 기록 탭                | 회원                            |
| `/profile`                                            | 프로필 탭                  | 회원                            |
| `/me`                                                 | 프로필 탭 호환 URL           | 회원                            |

---

## 6. URL 읽기 기준

`readAppRoute()`는 현재 URL을 읽어 `AppRouteState`로 변환한다.

변환 기준:

```text id="qvx187"
/login                         -> { flow: "login" }
/signup                        -> { flow: "signup-name" }
/guest                         -> { flow: "guest-categories" }
/ 또는 /home                   -> { tab: "home" }
/preferences                   -> { tab: "preferences" }
/recommendations/personal      -> { tab: "personal" }
/meetings                      -> { tab: "meeting" }
/meetings/{meetingId}          -> { tab: "meeting", meetingId }
/history                       -> { tab: "history" }
/profile 또는 /me              -> { tab: "profile" }
```

query parameter 기준:

```text id="f5igvd"
/recommendations/personal?selectedMenuId=3
  -> selectedPersonalMenuId = 3

/meetings/7?recommendationMenuId=2
  -> meetingId = 7
  -> selectedMeetingMenuId = 2
```

숫자 ID는 양의 정수일 때만 유효한 값으로 처리한다. 유효하지 않은 값은 `undefined`로 처리한다.

---

## 7. URL 쓰기 기준

`buildAppUrl()`은 현재 앱 state를 URL로 변환한다.

입력 state:

```ts id="scz0lv"
type BuildAppUrlState = {
  flow: Flow;
  activeTab: Tab;
  isGuestSession: boolean;
  selectedMeetingId?: number;
  selectedPersonalMenuId?: number;
  selectedMeetingMenuId?: number;
};
```

변환 규칙:

### 7.1 `flow !== "app"`인 경우

앱 내부 탭이 아니라 인증/온보딩 flow로 간주한다.

| Flow 조건               | URL       |
| --------------------- | --------- |
| `flow === "login"`    | `/login`  |
| `flow`가 `signup`으로 시작 | `/signup` |
| `flow`가 `guest`로 시작   | `/guest`  |
| 그 외                   | `/`       |

즉, 회원가입 내부 단계가 `signup-categories`, `signup-tags`, `signup-allergies`처럼 세분화되어 있어도 URL은 `/signup`으로 표현한다. 게스트 내부 단계도 마찬가지로 `/guest`로 표현한다.

### 7.2 `flow === "app"`인 경우

앱 내부 tab을 URL로 표현한다.

| Tab           | URL                                    |
| ------------- | -------------------------------------- |
| `home`        | `/home`                                |
| `preferences` | `/preferences`                         |
| `personal`    | `/recommendations/personal`            |
| `meeting`     | `/meetings` 또는 `/meetings/{meetingId}` |
| `history`     | `/history`                             |
| `profile`     | `/profile`                             |

### 7.3 게스트 세션인 경우

게스트는 특정 모임 참여를 목적으로 하는 제한된 세션이다. 따라서 `isGuestSession`이 true이면 `activeTab`과 관계없이 URL tab은 `meeting`으로 처리한다.

```text id="2i4bua"
isGuestSession = true
-> visible tab = meeting
```

게스트에게 일반 회원의 탐색형 화면을 모두 열어주지 않기 위한 기준이다.

### 7.4 선택된 추천 메뉴가 있는 경우

개인 추천에서 선택된 메뉴가 있으면 query parameter를 붙인다.

```text id="eeecyl"
/recommendations/personal?selectedMenuId={menuId}
```

모임 추천에서 선택된 추천 메뉴가 있으면 query parameter를 붙인다.

```text id="51ikp4"
/meetings/{meetingId}?recommendationMenuId={menuId}
```

---

## 8. Flow 상태 기준

`flow`는 비로그인, 인증, 온보딩, 앱 진입 상태를 표현한다.

| Flow                    | 의미                         | 주요 진입                      |
| ----------------------- | -------------------------- | -------------------------- |
| `start`                 | 시작 화면                      | 최초 방문, 로그아웃, 세션 만료         |
| `login`                 | 이메일 로그인                    | `/login`, 시작 화면 로그인        |
| `signup-name`           | 이메일 회원가입 입력                | 일반 회원가입 시작                 |
| `signup-email-sent`     | 이메일 인증 안내                  | 회원가입 요청 후                  |
| `oauth-nickname`        | Google OAuth 신규 사용자 닉네임 입력 | OAuth callback 후 닉네임 필요    |
| `signup-categories`     | 회원 카테고리 선호 입력              | 이메일 회원가입 또는 OAuth 닉네임 저장 후 |
| `signup-tags`           | 회원 태그 선호 입력                | 카테고리 다음                    |
| `signup-allergies`      | 회원 알러지 입력                  | 태그 다음                      |
| `signup-recent-penalty` | 최근 식사 패널티 입력               | 알러지 다음                     |
| `signup-complete`       | 회원 온보딩 완료                  | 선호도 저장 후                   |
| `guest-categories`      | 게스트 카테고리 선호 입력             | 게스트 시작                     |
| `guest-tags`            | 게스트 태그 선호 입력               | 카테고리 다음                    |
| `guest-allergies`       | 게스트 알러지 입력                 | 태그 다음                      |
| `guest-join-meeting`    | 모임 ID 입력                   | 게스트 선호도 완료 후               |
| `guest-display-name`    | 모임 확인 후 표시 이름 입력           | meeting preview 성공 후       |
| `app`                   | 메인 앱 탭 UI                  | 로그인/가입/게스트 참여 완료           |

주의:

* `flow`의 세부 단계가 URL path에 모두 직접 표현되지는 않는다.
* 회원가입 세부 단계는 `/signup`으로 묶는다.
* 게스트 세부 단계는 `/guest`로 묶는다.
* 실제 세부 flow 상태는 React state에서 관리한다.

---

## 9. 메인 탭 구조

`flow === "app"`일 때 `activeTab`이 앱 내부 화면을 제어한다.

| Tab           | 화면       | 권한            |
| ------------- | -------- | ------------- |
| `home`        | 홈        | 회원            |
| `meeting`     | 모임 목록/상세 | 회원, 게스트 제한 접근 |
| `profile`     | 프로필      | 회원            |
| `preferences` | 선호도 관리   | 회원            |
| `personal`    | 개인 추천    | 회원            |
| `history`     | 식사 기록    | 회원            |

현재 하단 네비게이션에는 주로 `meeting`, `home`, `profile`이 노출된다. `preferences`, `personal`, `history`는 홈 카드, 프로필 버튼, 추천/기록 CTA 등을 통해 진입한다.

`AppScreens`는 `visibleTab`을 기준으로 각 feature view를 렌더링한다.

```text id="miwo15"
visibleTab = home        -> HomeView
visibleTab = preferences -> PreferencesView
visibleTab = personal    -> PersonalView
visibleTab = meeting     -> MeetingView
visibleTab = history     -> HistoryView
visibleTab = profile     -> ProfileView
```

---

## 10. 사용자 유형별 접근 기준

| 화면/액션       |         회원 |          게스트 |
| ----------- | ---------: | -----------: |
| 시작 화면       |         가능 |           가능 |
| 회원 온보딩      |         가능 |           불가 |
| 게스트 온보딩     |         가능 |           가능 |
| 홈           |         가능 |           제한 |
| 개인 추천       |         가능 |           불가 |
| 식사 기록       |         가능 |           불가 |
| 선호도 관리      |         가능 | 게스트 세션에서는 제한 |
| 모임 ID 입력    |         가능 |           가능 |
| 모임 preview  |         가능 |           가능 |
| 모임 참여       |         가능 |           가능 |
| 모임 상세 조회    |   참여 모임 가능 |     참여 모임 가능 |
| 모임 추천 결과 조회 |   참여 모임 가능 |     참여 모임 가능 |
| 모임 추천 계산    |  모임 생성자 중심 |           제한 |
| 모임 메뉴 확정    | 모임 생성자만 가능 |           불가 |
| 모임 목록 이동    |         가능 |      게스트는 제한 |

게스트는 특정 모임 참여를 목적으로 하는 임시 사용자이다. 따라서 게스트 세션에서는 일반 회원의 탐색형 화면을 모두 열어주지 않고, 참여한 모임 화면 중심으로 동작한다.

---

## 11. 핵심 이동 시나리오

### 11.1 이메일 회원가입

```text id="a7s1vn"
start
-> signup-name
-> signup-email-sent
-> login
-> signup-categories
-> signup-tags
-> signup-allergies
-> signup-recent-penalty
-> signup-complete
-> app/home
```

설명:

* 사용자가 이메일/비밀번호/닉네임으로 회원가입한다.
* 이메일 인증 안내 화면을 확인한다.
* 인증 후 로그인한다.
* 선호도 온보딩을 완료한다.
* 앱 홈으로 이동한다.

---

### 11.2 기존 회원 로그인

```text id="wybt5z"
start
-> login
-> app/home
```

설명:

* 기존 회원은 이메일/비밀번호 로그인으로 진입한다.
* 로그인 성공 시 access token, refresh token, expiresAt을 저장한다.
* 앱 홈으로 이동한다.

---

### 11.3 Google OAuth 기존 회원

```text id="ykhfgw"
start
-> OAuth callback
-> profile sync
-> app/home
```

설명:

* 사용자가 Google OAuth로 로그인한다.
* OAuth callback으로 Supabase session을 받는다.
* backend profile sync를 수행한다.
* 기존 프로필이 있으면 바로 앱 홈으로 이동한다.

---

### 11.4 Google OAuth 신규 사용자

```text id="i03szn"
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

설명:

* 소셜 로그인 신규 사용자는 이메일/비밀번호를 다시 입력하지 않는다.
* OAuth callback으로 세션을 받은 뒤 닉네임만 입력한다.
* 닉네임 저장 후 일반 회원과 같은 선호도 온보딩을 진행한다.

OAuth 설정 주의:

* Supabase provider 설정이 필요하다.
* Supabase Redirect URLs allowlist가 배포 URL과 일치해야 한다.
* Google Cloud Console에는 프론트 URL이 아니라 Supabase callback URL을 OAuth redirect URI로 등록한다.

```text id="ux8lj5"
https://{project-ref}.supabase.co/auth/v1/callback
```

---

### 11.5 게스트 모임 참여

```text id="s3bnr6"
start
-> guest-categories
-> guest-tags
-> guest-allergies
-> guest-join-meeting
-> guest-display-name
-> app/meeting detail
```

설명:

* 게스트는 임시 계정으로 시작한다.
* 카테고리, 태그, 알러지 조건을 입력한다.
* 모임 ID를 입력한다.
* 모임 preview를 확인한다.
* 모임 안에서 사용할 표시 이름을 입력한다.
* 모임 상세 화면으로 이동한다.

게스트는 최근 식사 기록이 없으므로 회원 온보딩과 달리 `recentDuplicateDays` 설정을 받지 않는다.

---

### 11.6 개인 추천

```text id="ca4a4q"
app/home
-> personal
-> 추천 조건 입력
-> 추천 요청
-> 랭킹 표시
-> 후보 선택
-> 최종 확정
-> meal-history 생성
-> history
```

설명:

* 홈에서 개인 추천 화면으로 이동한다.
* 최근 식사 중복 패널티와 예산 조건을 확인한다.
* 추천 API를 호출한다.
* 추천 결과 중 하나를 선택한다.
* 최종 확정하면 식사 기록을 생성한다.
* 확정 후 식사 기록 화면으로 이동할 수 있다.

---

### 11.7 모임 추천

```text id="x7czwz"
app/meeting
-> 모임 생성 또는 모임 상세
-> 구성원 확인
-> 구성원 포함/제외 선택
-> 추천 계산
-> 랭킹 표시
-> 후보 선택
-> 모임 생성자 최종 확정
```

설명:

* 모임 생성자는 모임을 만들거나 기존 모임 상세로 이동한다.
* 참여자 목록을 확인한다.
* 추천 계산에 포함할 참여자를 선택한다.
* 모임 추천 API를 호출한다.
* 추천 결과 중 하나를 선택한다.
* 모임 생성자가 최종 메뉴를 확정한다.

---

## 12. 새로고침 복원 기준

새로고침 후 복원은 URL state와 localStorage state를 함께 사용한다.

| 데이터             | 복원 여부 | 기준                                                                             |
| --------------- | ----: | ------------------------------------------------------------------------------ |
| access token    |    복원 | `authSessionStorage.accessToken`                                               |
| refresh token   |    복원 | `authSessionStorage.refreshToken`                                              |
| access token 만료 |    복구 | 만료 전 또는 401 응답 시 `POST /auth/refresh`                                          |
| 게스트 여부          |    복원 | `sessionStorageMeta.isGuest`                                                   |
| 게스트 모임 ID       |    복원 | `sessionStorageMeta.meetingId`                                                 |
| 게스트 표시 이름       |    복원 | `sessionStorageMeta.displayName`                                               |
| active tab      |    복원 | URL path 우선, 없으면 `appUiStateStorage.activeTab`                                 |
| 개인 추천 리스트       |    복원 | `appUiStateStorage.personalRecommendations`                                    |
| 개인 추천 선택 후보     |    복원 | `selectedMenuId` query 우선, 없으면 `appUiStateStorage.selectedPersonalMenuId`      |
| 모임 상세           |    복원 | `/meetings/{meetingId}` 또는 게스트 `sessionStorageMeta.meetingId`                  |
| 모임 추천 선택 후보     |    복원 | `recommendationMenuId` query 우선, 없으면 `appUiStateStorage.selectedMeetingMenuId` |

복원 우선순위:

```text id="p1ax7x"
URL state
-> appUiStateStorage
-> sessionStorageMeta
-> 기본값
```

기본값:

```text id="z5x4q0"
비로그인: start
로그인 회원: home
게스트: meeting
```

---

## 13. URL 동기화 기준

`useAppUrlSync`는 앱 상태와 URL을 동기화한다.

### 13.1 UI state 저장

`flow === "app"`이면 다음 상태를 `appUiStateStorage`에 저장한다.

```text id="wva05m"
activeTab
selectedMeetingId
selectedPersonalMenuId
selectedMeetingMenuId
personalRecommendations
```

개인 추천 결과는 새로고침 후 화면 복원을 위해 필요한 일부 필드만 저장한다.

---

### 13.2 앱 상태 → URL 반영

앱 상태가 바뀌면 `buildAppUrl()`로 다음 URL을 계산한다.

```text id="w6f5pv"
state -> buildAppUrl() -> nextUrl
```

현재 URL과 다르면 다음 방식으로 URL을 갱신한다.

```text id="jr0o55"
window.history.pushState({}, "", nextUrl)
```

중복 push를 막기 위해 다음 경우에는 URL을 갱신하지 않는다.

* route sync가 아직 준비되지 않은 경우
* `popstate` 적용 중인 경우
* 계산된 URL이 현재 URL과 같은 경우
* 계산된 URL이 마지막으로 sync한 URL과 같은 경우

---

### 13.3 URL → 앱 상태 반영

브라우저 뒤로가기/앞으로가기가 발생하면 `popstate` 이벤트를 감지한다.

```text id="5az46i"
popstate
-> readAppRoute()
-> applyRouteState()
-> 화면 상태 복원
```

`flow !== "app"` 상태에서 `popstate`가 발생하면 URL에서 flow만 읽고 해당 flow로 이동한다.

`flow === "app"` 상태에서는 `applyRouteState(readAppRoute())`를 호출해 active tab, selected meeting, selected recommendation 등을 복원한다.

---

## 14. 공유 URL 기준

공유 가능한 URL은 다음과 같다.

| URL                                                   | 공유 의미                 |
| ----------------------------------------------------- | --------------------- |
| `/login`                                              | 로그인 화면 직접 진입          |
| `/signup`                                             | 회원가입 화면 직접 진입         |
| `/guest`                                              | 게스트 시작 화면 직접 진입       |
| `/meetings/{meetingId}`                               | 특정 모임 상세 화면 진입        |
| `/meetings/{meetingId}?recommendationMenuId={menuId}` | 특정 모임의 추천 후보 선택 상태 복원 |
| `/recommendations/personal?selectedMenuId={menuId}`   | 개인 추천 후보 선택 상태 복원     |

주의:

* 개인 추천 URL은 최근 추천 리스트가 `appUiStateStorage`에 남아 있을 때 의미가 있다.
* 모임 상세 URL은 서버에서 해당 사용자가 모임 생성자 또는 참여자인지 확인해야 한다.
* 게스트는 `sessionStorageMeta.meetingId`가 있으면 해당 모임 화면으로 복원할 수 있다.
* 권한이 없는 사용자가 모임 상세 URL에 직접 접근하면 backend API에서 차단된다.

---

## 15. 권한별 라우팅 처리

### 15.1 비로그인 사용자

비로그인 사용자가 접근 가능한 flow:

```text id="nltyjr"
/
/login
/signup
/guest
```

비로그인 사용자가 앱 내부 tab URL로 직접 접근하면 세션 복원 시도 후 실패하면 시작 화면으로 이동한다.

---

### 15.2 로그인 회원

로그인 회원이 접근 가능한 tab:

```text id="p4ou0l"
home
preferences
personal
meeting
history
profile
```

회원은 모임 생성, 개인 추천, 식사 기록 관리, 선호도 저장을 사용할 수 있다.

---

### 15.3 게스트 사용자

게스트는 다음 화면 중심으로 동작한다.

```text id="rsixlp"
guest onboarding
meeting preview
meeting detail
meeting recommendation result
```

게스트 제한:

* 개인 추천 불가
* 식사 기록 관리 불가
* 프로필 일반 기능 제한
* 모임 메뉴 확정 불가
* 일반 모임 목록 탐색 제한

게스트 세션의 URL은 가능한 한 모임 화면으로 고정한다.

---

## 16. 상태 저장 키

라우팅과 복원에 관련된 localStorage key는 다음과 같다.

| key                    | 설명                              |
| ---------------------- | ------------------------------- |
| `mukpick.accessToken`  | access token                    |
| `mukpick.refreshToken` | refresh token                   |
| `mukpick.expiresAt`    | access token 만료 시각              |
| `mukpick.session`      | 게스트 여부, 모임 ID, displayName      |
| `mukpick.appUiState`   | active tab, 선택된 모임/추천, 개인 추천 결과 |

주의:

* `sessionStorageMeta`라는 이름을 사용하지만 실제 저장소는 `localStorage`이다.
* localStorage 저장 실패는 앱 사용을 막지 않고, 새로고침 복원만 제한될 수 있다.
* 로그아웃 또는 세션 만료 시 저장된 인증/세션 상태를 정리한다.

---

## 17. 뒤로가기/앞으로가기 기준

뒤로가기와 앞으로가기는 browser history를 기준으로 동작한다.

처리 기준:

* 앱 상태 변경 시 `history.pushState`로 URL을 갱신한다.
* 사용자가 뒤로가기/앞으로가기를 누르면 `popstate`가 발생한다.
* `popstate`에서는 현재 URL을 다시 읽어 앱 상태에 반영한다.
* `popstate` 적용 중에는 다시 `pushState`를 실행하지 않는다.
* URL로 복원할 수 없는 세부 상태는 `appUiStateStorage`를 보조로 사용한다.

예시:

```text id="nx8q20"
/home
-> /recommendations/personal
-> /recommendations/personal?selectedMenuId=3
-> 뒤로가기
-> /recommendations/personal
```

```text id="c0mamv"
/meetings
-> /meetings/7
-> /meetings/7?recommendationMenuId=2
-> 뒤로가기
-> /meetings/7
```

---

## 18. 라우팅 QA 체크리스트

라우팅 관련 수정 후 다음 항목을 확인한다.

* `/` 진입 시 시작 화면 또는 세션 복원 후 홈으로 이동하는가
* `/login` 직접 진입 시 로그인 flow가 보이는가
* `/signup` 직접 진입 시 회원가입 flow가 보이는가
* `/guest` 직접 진입 시 게스트 flow가 보이는가
* 로그인 후 `/home`으로 이동하는가
* 홈에서 개인 추천으로 이동하면 `/recommendations/personal`이 되는가
* 개인 추천 후보 선택 시 `selectedMenuId` query가 붙는가
* 새로고침 후 개인 추천 선택 상태가 복원되는가
* 모임 목록 진입 시 `/meetings`가 되는가
* 모임 상세 진입 시 `/meetings/{meetingId}`가 되는가
* 모임 추천 후보 선택 시 `recommendationMenuId` query가 붙는가
* 새로고침 후 모임 상세와 추천 선택 상태가 복원되는가
* `/profile`과 `/me`가 모두 프로필 탭으로 연결되는가
* 게스트 세션에서 다른 tab으로 이동하려 해도 meeting 중심으로 유지되는가
* 뒤로가기/앞으로가기 시 active tab이 URL과 맞게 바뀌는가
* 로그아웃 후 `/` 또는 시작 화면으로 돌아가는가
* 세션 만료 후 보호된 화면에 남아 있지 않는가

---

## 19. 향후 React Router 전환 기준

현재는 React Router를 사용하지 않지만, 향후 route tree 기반으로 전환할 수 있다. 이 경우에도 현재 URL 계약을 유지하는 것이 좋다.

유지할 URL 계약:

```text id="2v4424"
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

전환 시 주의:

* 기존 `AppRouteState` 개념을 route params/query params로 매핑한다.
* `selectedMenuId`, `recommendationMenuId` query parameter는 유지한다.
* 게스트 세션의 meeting 중심 제한을 route guard로 옮긴다.
* 인증 세션 복원과 token refresh는 route 진입 전에 확인한다.
* 기존 `AppRouter`를 그대로 되살리는 방식이 아니라, 현재 URL 계약을 기준으로 새 route tree를 설계한다.

---

## 20. 요약

현재 MUK PICK 프론트엔드는 React Router를 사용하지 않고, `MukpickApp`의 앱 상태와 `useAppUrlSync`의 URL 동기화를 통해 화면 이동을 처리한다. `appNavigation.ts`는 URL을 앱 상태로 읽고, 앱 상태를 URL로 다시 변환하는 기준을 제공한다.

라우팅의 핵심은 `flow`, `activeTab`, `selectedMeetingId`, `selectedPersonalMenuId`, `selectedMeetingMenuId`를 일관되게 관리하는 것이다. URL은 현재 화면과 선택 상태를 표현하는 대표 상태이고, localStorage는 새로고침 복원을 위한 보조 상태로 사용된다.