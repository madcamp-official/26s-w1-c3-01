# MUK PICK Frontend Routing and Navigation

## 1. 목적

이 문서는 MUK PICK 프론트엔드의 화면 이동 기준을 정의한다. 현재 구현은 URL 기반 라우팅보다 모바일 앱처럼 내부 상태로 화면을 전환하는 구조를 사용한다.

## 2. 현재 활성 라우팅 기준

현재 활성 기준은 `frontend/src/main.tsx`에서 렌더링하는 `App`이다.

```text
main.tsx -> App.tsx
```

`BrowserRouter`와 `AppRouter`는 현재 진입점에서 사용하지 않는다.

## 3. Legacy URL 라우트

`frontend/src/routes/AppRouter.tsx`에는 다음 React Router 라우트가 남아 있다.

| URL | 화면 | 현재 상태 |
|---|---|---|
| `/login` | 로그인 | legacy |
| `/signup` | 회원가입 | legacy |
| `/` | 개인 추천 redirect | legacy |
| `/onboarding/preferences` | 선호도 온보딩 | legacy |
| `/preferences` | 선호도 관리 | legacy |
| `/recommendations/personal` | 개인 추천 | legacy |
| `/meetings` | 모임 목록 | legacy |
| `/meetings/new` | 모임 생성 | legacy |
| `/meetings/:meetingId` | 모임 상세 | legacy |
| `/meal-history` | 식사 기록 | legacy |
| `/menus` | 메뉴 목록 | legacy |
| `/menus/:menuId` | 메뉴 상세 | legacy |
| `/me` | 마이페이지 | legacy |

새 구현 작업에서는 이 라우트가 실제 화면 기준이라고 가정하지 않는다.

## 4. 현재 모바일 앱 Flow

`App.tsx`의 `flow` 상태가 인증/온보딩 화면을 제어한다.

| Flow | 의미 | 주요 진입 |
|---|---|---|
| `start` | 시작 화면 | 최초 방문, 로그아웃 |
| `signup-name` | 회원 닉네임 입력 | 회원 시작 |
| `signup-categories` | 회원 카테고리 선호 입력 | 닉네임 입력 후 |
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
-> login/signup fallback
-> app/home
```

현재 개발용 기존 회원 진입은 지정된 개발 계정으로 로그인 또는 생성하는 방식이다.

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
| access token | 복원 | `tokenStorage` |
| 게스트 여부 | 복원 | `sessionStorageMeta.isGuest` |
| 게스트 모임 ID | 복원 | `sessionStorageMeta.meetingId` |
| 게스트 표시 이름 | 복원 | `sessionStorageMeta.displayName` |
| active tab | 향후 복원 권장 | 현재는 React state 중심 |
| 선택된 추천 후보 | 복원하지 않음 | 사용자가 다시 선택 |

## 9. 향후 URL 라우팅 전환 기준

현재는 모바일 앱 UX를 위해 내부 상태 라우팅을 사용한다. 다음 조건 중 하나가 필요해지면 React Router를 다시 활성화한다.

- 모임 상세 URL 공유가 필요하다.
- 브라우저 뒤로가기/앞으로가기와 화면 상태를 맞춰야 한다.
- 새로고침 후 특정 화면으로 직접 복원해야 한다.
- Vercel/검색/공유 링크 기준의 페이지 단위가 필요하다.

전환 시에도 `AppRouter`를 그대로 부활시키지 않고, 현재 모바일 flow를 기준으로 route tree를 다시 설계한다.

