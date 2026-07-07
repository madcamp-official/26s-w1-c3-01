# MUK PICK 프론트엔드 UI 개편 문서

## 1. 목적

현재 프론트엔드는 기능 구현 중심으로는 잘 분리되어 있지만, UI는 모바일 앱 목업 구조를 넓은 웹 화면에 그대로 확장하는 형태에 가깝다. 그 결과 데스크탑 화면에서 다음 문제가 발생한다.

- 화면 폭은 넓어졌지만 핵심 콘텐츠가 중앙의 카드 내부에 갇혀 보인다.
- `phone-frame`, `screen`, `bottom-nav`가 모바일 앱 프레임을 기준으로 설계되어 넓은 화면의 장점을 충분히 쓰지 못한다.
- 모임 상세, 추천 결과, 선호도 설정처럼 정보량이 많은 화면에서도 세로 스택 구조가 유지되어 가독성이 떨어진다.
- CSS-only override가 누적되면서 `styles.css`가 길어지고 cascade 충돌 가능성이 커졌다.

따라서 목표는 “모바일 앱 화면을 억지로 키운 UI”가 아니라, **모바일에서는 앱형 화면, 데스크탑에서는 웹앱형 대시보드**로 동작하는 반응형 구조로 재정리하는 것이다.

---

## 2. 현재 프론트엔드 구조 요약

### 2.1 기술 스택

현재 프론트엔드는 다음 구조다.

- React 19
- TypeScript
- Vite
- TailwindCSS import는 있지만, 실제 UI 스타일 대부분은 `src/styles.css`의 커스텀 CSS로 작성됨
- 아이콘은 `lucide-react`
- Supabase Auth는 프론트에서 직접 OAuth 시작 용도로 사용
- 일반 데이터 호출은 `src/api/*` 모듈을 통해 백엔드 API 호출

### 2.2 진입 구조

핵심 진입 흐름은 다음과 같다.

```txt
src/main.tsx
  → src/App.tsx
    → src/app/MukpickApp.tsx
      → AuthFlow 또는 AppScreens
```

`MukpickApp.tsx`는 인증 상태, 선호도 상태, 추천 상태, 모임 상태, 히스토리 상태를 대부분 들고 있는 최상위 컨테이너다. 실제 화면은 `AppScreens.tsx`에서 `visibleTab`에 따라 lazy loading 방식으로 렌더링된다.

```txt
AppScreens
  ├─ HomeView
  ├─ PreferencesView
  ├─ PersonalView
  ├─ MeetingView
  │   ├─ MeetingList
  │   └─ MeetingDetail
  ├─ HistoryView
  └─ ProfileView
```

이 구조는 기능 단위 분리는 되어 있지만, 레이아웃 관점에서는 아직 공통 레이아웃 계층이 부족하다.

---

## 3. 현재 UI 구조의 핵심 문제

## 3.1 `phone-frame` 중심 설계

현재 전체 앱 화면은 `AppScreens`에서 다음 구조로 렌더링된다.

```tsx
<div className="app-shell">
  <main className="phone-frame">
    <AppHeader />
    <Screen />
    <BottomNav />
  </main>
</div>
```

초기에는 모바일 목업 기준으로 적절하지만, 웹 화면에서는 `phone-frame`이 전체 앱을 하나의 큰 모바일 프레임처럼 만든다. 최근 override로 폭을 늘렸지만, 기본 구조는 여전히 “확장된 휴대폰 화면”에 가깝다.

### 문제

- 데스크탑에서도 하단 네비게이션이 유지된다.
- 페이지별 콘텐츠 영역이 하나의 `screen` 안에 갇힌다.
- 모임 상세와 추천 결과처럼 2단/3단 구성이 필요한 화면도 강제로 세로 배치된다.

### 개선 방향

`phone-frame`을 UI 중심 개념으로 쓰지 말고, 다음처럼 역할을 분리한다.

```txt
AppShell
  ├─ AppSidebar 또는 TopNavigation
  └─ AppContent
      ├─ PageHeader
      └─ PageBody
```

모바일에서는 기존처럼 `BottomNav`를 유지하고, 데스크탑에서는 사이드바 또는 상단 탭형 네비게이션으로 전환한다.

---

## 4. 권장 전체 레이아웃 전략

## 4.1 반응형 기준

다음 breakpoints를 기준으로 잡는 것이 적절하다.

| 구간 | 기준 | UI 전략 |
|---|---:|---|
| Mobile | `< 768px` | 기존 모바일 앱형 구조 유지 |
| Tablet | `768px ~ 1023px` | 카드 폭 확장, 2열 일부 적용 |
| Desktop | `>= 1024px` | 웹앱형 대시보드 구조 적용 |
| Wide Desktop | `>= 1280px` | 좌측/우측 보조 패널 적극 활용 |

현재 override는 `900px` 기준으로 되어 있는데, 실제 리팩토링 시에는 `1024px` 기준이 더 안정적이다. 900px은 태블릿 가로 모드와 데스크탑 사이 애매한 구간이라 레이아웃이 쉽게 답답해질 수 있다.

## 4.2 공통 페이지 구조

각 화면이 직접 `.screen`을 사용하는 대신, 공통 레이아웃 컴포넌트를 두는 것이 좋다.

```tsx
<AppLayout activeTab={visibleTab}>
  <Page title="모임 추천" description="...">
    {children}
  </Page>
</AppLayout>
```

권장 컴포넌트:

```txt
components/layout/
  AppLayout.tsx
  Page.tsx
  PageHeader.tsx
  PageGrid.tsx
  ContentCard.tsx
  ActionBar.tsx
  SidebarNav.tsx
  MobileBottomNav.tsx
```

이렇게 하면 `HomeView`, `MeetingList`, `MeetingDetail`, `PersonalView`, `PreferencesView`가 각자 레이아웃을 중복으로 만들지 않아도 된다.

---

## 5. 화면별 UI 개편안

# 5.1 홈 화면

## 현재 구조

`HomeView.tsx`는 다음 구성이다.

```txt
HomeView
  ├─ API banner
  ├─ home-title
  ├─ home-feature-grid
  │   ├─ 개인 메뉴 추천 카드
  │   └─ 모임 생성 카드
  └─ 최근 식사 panel
```

현재 홈은 구조가 단순해서 가장 안정적이다. 다만 넓은 화면에서는 상단 타이틀과 두 개의 메인 카드가 중앙에만 몰려 있어 공간 활용이 제한적이다.

## 변경 방향

데스크탑에서는 “메인 액션 + 보조 정보” 구조가 적합하다.

```txt
┌──────────────────────────────────────────────┐
│ 오늘은 뭘 먹어볼까요?                         │
│ 취향과 상황에 맞는 메뉴를 추천받아보세요        │
├───────────────────────┬──────────────────────┤
│ 개인 메뉴 추천         │ 최근 식사             │
│ 큰 CTA 카드            │ 최근 메뉴 3~5개        │
├───────────────────────┼──────────────────────┤
│ 모임 생성              │ 내 선호도 요약         │
│ 큰 CTA 카드            │ 카테고리/태그 요약     │
└───────────────────────┴──────────────────────┘
```

## 구현 권장

- `home-feature-grid`는 데스크탑에서 2열 유지.
- 오른쪽 또는 하단에 `recent-panel`, `preference-summary-panel` 추가.
- 홈에서 단순 CTA만 보여주지 말고, “현재 저장된 취향”, “최근 먹은 메뉴”, “최근 모임”을 요약해서 보여준다.

## 권장 JSX 구조

```tsx
<section className="home-dashboard">
  <div className="home-main-actions">
    <HomeActionCard variant="personal" />
    <HomeActionCard variant="meeting" />
  </div>

  <aside className="home-side-panels">
    <RecentMealsPanel />
    <PreferenceSummaryPanel />
  </aside>
</section>
```

---

# 5.2 모임 목록 화면

## 현재 구조

`MeetingList.tsx`는 다음 순서로 구성되어 있다.

```txt
ScreenTitle
새 모임 만들기 버튼
JoinMeetingPanel
meeting-list
```

현재는 모든 요소가 세로로 쌓인다. 데스크탑에서는 모임 카드가 2열로 보이도록 override했지만, 상단 액션 영역은 아직 충분히 정리되지 않았다.

## 변경 방향

모임 목록은 “작업 영역”과 “목록 영역”을 분리하는 것이 좋다.

```txt
┌──────────────────────────────────────────────┐
│ 모임 추천                         [새 모임 만들기] │
│ 참여자 조건을 모아 메뉴를 찾습니다               │
├───────────────────────┬──────────────────────┤
│ 참여 코드로 입장        │ 내 모임 목록            │
│ Meeting ID 입력        │ 2열 카드 그리드         │
└───────────────────────┴──────────────────────┘
```

## 구현 권장

- `JoinMeetingPanel`은 데스크탑에서 왼쪽 고정 패널로 둔다.
- `meeting-list`는 오른쪽 2열 또는 3열 카드 그리드로 구성한다.
- 모임이 많아질 가능성을 고려하면 필터가 필요하다.
  - 전체
  - 진행 중
  - 완료
  - 내가 만든 모임

## 권장 JSX 구조

```tsx
<section className="meeting-list-layout">
  <aside className="meeting-join-aside">
    <JoinMeetingPanel />
  </aside>

  <main className="meeting-list-main">
    <MeetingListToolbar />
    <MeetingCardGrid />
  </main>
</section>
```

---

# 5.3 모임 상세 화면

## 현재 구조

`MeetingDetail.tsx`는 현재 UI 개선 우선순위가 가장 높다.

```txt
back button
ScreenTitle
meeting-detail-card
  ├─ 상태
  ├─ 역할
  ├─ ID/시간/장소
  ├─ 참여자 보기
  └─ 수정 패널
section.group-result
  ├─ 추천 메뉴 헤더
  ├─ RecommendationList
  └─ final-choice-bar
```

기존 화면에서는 모임 정보 카드가 위쪽을 크게 차지하고, 추천 결과가 아래로 밀린다. 사용자가 실제로 보고 싶은 것은 추천 메뉴인데, 정보 우선순위가 반대로 잡혀 있다.

## 변경 방향

데스크탑에서는 모임 정보는 왼쪽 요약, 추천 결과는 오른쪽 메인으로 배치한다.

```txt
┌──────────────────────────────────────────────┐
│ ← 모임 목록                                  │
│ 새 점심 모임                                  │
├───────────────┬──────────────────────────────┤
│ 모임 요약       │ 이 모임의 추천 메뉴             │
│ - 상태          │ [다시 계산]                    │
│ - 모임 ID       │ 1. 김치찌개       146점         │
│ - 시간/장소     │ 2. 제육볶음       138점         │
│ - 참여자        │ 3. 돈까스         132점         │
│ - 정보 수정     │                              │
│               │ [최종 선택 바]                 │
└───────────────┴──────────────────────────────┘
```

## 구현 권장

- `MeetingDetail`을 다음 컴포넌트로 분리한다.

```txt
MeetingDetail
  ├─ MeetingDetailHeader
  ├─ MeetingSummaryAside
  ├─ MeetingRecommendationPanel
  └─ MeetingFinalActionBar
```

- `RecommendationList`는 `compact` boolean만 쓰기보다 `variant`를 도입한다.

```tsx
<RecommendationList variant="wide" />
<RecommendationList variant="compact" />
<RecommendationList variant="grid" />
```

- 최종 선택 바는 추천 패널 하단에 sticky로 두는 것이 낫다.

```css
.meeting-final-action-bar {
  position: sticky;
  bottom: 0;
}
```

다만 현재 `bottom-nav`가 absolute이므로, 데스크탑에서 `bottom-nav`를 사이드/탑 네비게이션으로 빼기 전까지는 sticky bottom이 겹칠 수 있다.

---

# 5.4 개인 추천 화면

## 현재 구조

`PersonalView.tsx`는 조건 설정과 추천 결과가 같은 세로 흐름 안에 있다.

```txt
ScreenTitle
condition-panel
RecommendationList
final-choice-bar
```

조건 패널이 위에 있고 결과가 아래에 있어 모바일에서는 자연스럽지만, 데스크탑에서는 추천 결과를 보기 위해 시선이 아래로 이동한다.

## 변경 방향

개인 추천 화면은 데스크탑에서 다음 구조가 적합하다.

```txt
┌─────────────────┬────────────────────────────┐
│ 추천 조건         │ 개인 추천 결과               │
│ - 중복 패널티     │ 1. 메뉴                      │
│ - 새 메뉴 포함    │ 2. 메뉴                      │
│ - 예산 범위       │ 3. 메뉴                      │
│ [추천 받기]       │ [최종 선택]                  │
└─────────────────┴────────────────────────────┘
```

## 구현 권장

- 조건 패널은 왼쪽 aside로 고정한다.
- 추천 결과는 오른쪽 메인 영역으로 둔다.
- 결과가 없을 때의 `EmptyState`도 오른쪽 메인 영역에 표시한다.
- `final-choice-bar`는 오른쪽 추천 영역 하단에 둔다.

## 권장 JSX 구조

```tsx
<section className="personal-layout">
  <aside className="personal-condition-aside">
    <RecommendationConditionForm />
  </aside>

  <main className="personal-result-main">
    <RecommendationList variant="wide" />
    <FinalChoiceBar />
  </main>
</section>
```

---

# 5.5 선호도 관리 화면

## 현재 구조

`PreferencesView.tsx`는 내부 step 상태로 다음 흐름을 처리한다.

```txt
categories → tags → allergies → penalty → confirm
```

각 step은 같은 화면 전체를 교체하는 방식이다. 모바일 온보딩에서는 적절하지만, 데스크탑 설정 화면에서는 너무 단절적이다.

## 변경 방향

데스크탑에서는 “좌측 stepper + 우측 설정 영역 + 하단/우측 요약” 구조가 좋다.

```txt
┌──────────────┬──────────────────────────────┬──────────────┐
│ 설정 단계      │ 현재 단계 설정 항목              │ 선택 요약       │
│ 1 카테고리     │ 카드 그리드                     │ 카테고리 4개    │
│ 2 태그         │ 점수 슬라이더                   │ 태그 5개        │
│ 3 제한 조건    │                              │ 제한 1개        │
│ 4 중복 패널티  │                              │ 중복 7일        │
│ 5 확인         │                              │ [저장]          │
└──────────────┴──────────────────────────────┴──────────────┘
```

## 구현 권장

- 현재 step 로직은 그대로 유지하되, 데스크탑에서 step 버튼을 좌측에 노출한다.
- 선택 요약은 항상 오른쪽에 보여준다.
- `PreferenceScoreControls`는 선택 항목이 많아지면 현재처럼 세로 스크롤보다 2열 카드형으로 보여주는 것이 낫다.

## 컴포넌트 분리 권장

```txt
PreferencesView
  ├─ PreferenceStepper
  ├─ PreferenceStepContent
  ├─ PreferenceSummaryAside
  └─ PreferenceSaveBar
```

---

# 5.6 식사 기록 화면

## 현재 구조

`HistoryView.tsx`는 `history-timeline` 내부에 `history-row`를 반복 렌더링한다. 각 row에는 이미지, 날짜, 메뉴, 메모, 피드백 버튼, 수정/삭제 버튼이 들어간다.

## 변경 방향

데스크탑에서는 2가지 방식 중 하나가 적합하다.

### A안: 카드 그리드

```txt
┌──────────────┐ ┌──────────────┐
│ 이미지        │ │ 이미지        │
│ 날짜/메뉴     │ │ 날짜/메뉴     │
│ 좋아요/싫어요 │ │ 좋아요/싫어요 │
└──────────────┘ └──────────────┘
```

### B안: 테이블형 리스트

```txt
날짜        메뉴       메모       피드백       액션
7.8        김치찌개    ...        좋아요       수정/삭제
7.7        돈까스      ...        저장         수정/삭제
```

현재 디자인 톤에는 A안이 더 맞다. 데이터가 많아질 경우 B안이 더 실용적이다.

## 구현 권장

- 초기에는 2열 카드 그리드 유지.
- 이후 필터 추가:
  - 좋아요
  - 싫어요
  - 저장
  - 최근 7일
- 수정 폼은 row 내부 확장보다 modal 또는 side drawer가 더 안정적이다.

---

# 5.7 프로필 화면

## 현재 구조

`ProfileView.tsx`는 단순 카드 하나다.

```txt
ScreenTitle
profile-card
  ├─ avatar
  ├─ name
  ├─ description
  ├─ 선호도 관리
  └─ 로그아웃
```

## 변경 방향

프로필은 단순 정보 화면이 아니라 설정 허브로 바꾸는 것이 좋다.

```txt
┌────────────────────┬────────────────────┐
│ 내 정보              │ 선호도 상태           │
│ 닉네임               │ 카테고리/태그/제한 요약 │
│ 로그인 방식           │ [선호도 관리]          │
├────────────────────┼────────────────────┤
│ 식사 기록 요약        │ 계정 관리             │
│ 총 기록 수            │ 로그아웃              │
└────────────────────┴────────────────────┘
```

## 구현 권장

- `ProfileView`에 선호도 요약과 식사 기록 요약을 추가한다.
- 현재 `profileName`만 props로 받는데, 향후 `preferencesSummary`, `historyCount` 정도를 추가하면 화면 활용도가 올라간다.

---

# 5.8 인증/온보딩 화면

## 현재 구조

`AuthFlow`는 별도 파일에 있고, `start-card`, `auth-card`, `nickname-card`, `account-card` 클래스 기반으로 구성된다. 모바일 중심으로 적절히 구성되어 있다.

## 변경 방향

데스크탑에서는 좌측 브랜딩, 우측 입력 폼 구조가 좋다.

```txt
┌──────────────────────┬────────────────────┐
│ MUK PICK 브랜드 영역   │ 로그인/회원가입 폼    │
│ 로고, 설명, 음식 이미지 │ 소셜 로그인 버튼       │
└──────────────────────┴────────────────────┘
```

## 구현 권장

- `StartScreen`, `LoginScreen`, `SignupScreen`을 시각적으로 통일한다.
- OAuth, 이메일 회원가입, 게스트 진입의 우선순위를 명확히 정한다.
- 현재 버튼이 여러 개 있을 때 중요도가 비슷해 보이므로, primary/secondary/tertiary 버튼 구분을 명확히 한다.

---

## 6. 컴포넌트 리팩토링 제안

## 6.1 우선 분리할 컴포넌트

현재 구조에서 가장 먼저 분리해야 하는 컴포넌트는 다음이다.

```txt
components/layout/
  AppLayout.tsx
  Page.tsx
  PageHeader.tsx
  PageGrid.tsx
  ResponsiveNav.tsx

components/recommendation/
  RecommendationCard.tsx
  RecommendationList.tsx
  FinalChoiceBar.tsx

features/meetings/components/
  MeetingSummaryCard.tsx
  MeetingMemberSelector.tsx
  MeetingRecommendationPanel.tsx
  MeetingEditPanel.tsx

features/preferences/components/
  PreferenceStepper.tsx
  PreferenceSummaryAside.tsx
```

현재 `MeetingDetail.tsx`는 정보, 편집, 참여자 토글, 추천 결과, 최종 선택까지 모두 포함한다. UI 개편 시 가장 먼저 쪼개야 할 파일이다.

## 6.2 `RecommendationList` 개선

현재 `RecommendationList`는 `compact?: boolean`으로 모임 상세의 좁은 카드와 일반 카드만 구분한다. 앞으로는 다음처럼 variant 기반이 낫다.

```tsx
type RecommendationListVariant = "compact" | "wide" | "grid";
```

예시:

```tsx
<RecommendationList variant="wide" items={items} />
```

CSS도 다음처럼 명확해진다.

```css
.recommendation-list--wide {}
.recommendation-list--compact {}
.recommendation-list--grid {}
```

현재처럼 `.recommendation-list.compact`와 여러 media query override가 섞이는 것보다 유지보수가 낫다.

---

## 7. CSS 구조 개선안

## 현재 문제

현재 `src/styles.css`는 모든 화면 스타일과 override가 한 파일에 누적되어 있다. 이 방식은 빠르게 구현하기에는 좋지만, 지금 단계에서는 다음 문제가 생긴다.

- 특정 클래스가 어느 화면에서 쓰이는지 찾기 어렵다.
- override가 누적되면서 적용 순서에 의존한다.
- 모바일/데스크탑 스타일이 한 파일 안에서 섞인다.
- `phone-frame`, `screen`, `section-block` 같은 전역 클래스가 모든 화면에 영향을 준다.

## 권장 구조

Vite/React 프로젝트에서 간단하게 유지하려면 CSS Modules까지 가지 않아도 된다. 우선 아래처럼 파일만 분리해도 효과가 크다.

```txt
src/styles/
  tokens.css
  reset.css
  layout.css
  navigation.css
  components.css
  auth.css
  home.css
  meetings.css
  recommendations.css
  preferences.css
  history.css
  profile.css
  responsive.css
```

`src/main.tsx` 또는 `src/styles.css`에서 import한다.

```css
@import "./styles/tokens.css";
@import "./styles/reset.css";
@import "./styles/layout.css";
@import "./styles/navigation.css";
@import "./styles/components.css";
@import "./styles/home.css";
@import "./styles/meetings.css";
@import "./styles/recommendations.css";
@import "./styles/preferences.css";
@import "./styles/history.css";
@import "./styles/profile.css";
```

---

## 8. 네비게이션 개편안

현재 `BottomNav`는 `meeting`, `home`, `profile`만 노출한다. 하지만 실제 탭은 다음 6개다.

```ts
"home" | "preferences" | "personal" | "meeting" | "history" | "profile"
```

현재는 `preferences`, `personal`, `history`가 직접 네비게이션 항목이 아니라 홈/프로필 내부 액션으로 접근된다. 모바일에서는 괜찮지만 웹에서는 탐색성이 떨어진다.

## 권장

### 모바일

기존 3개 유지:

```txt
모임 | 홈 | 프로필
```

### 데스크탑

좌측 사이드바 또는 상단 탭에 6개 표시:

```txt
홈
개인 추천
모임 추천
식사 기록
선호도 관리
프로필
```

데스크탑에서 `preferences`, `personal`, `history`를 숨기면 사용자는 기능 위치를 기억해야 한다. 웹앱에서는 명시적으로 보여주는 편이 낫다.

---

## 9. 구현 우선순위

## Phase 1: 구조 변경 없이 안정화

목표: JSX 최소 수정, CSS 정리 중심.

- `phone-frame` 데스크탑 폭 확장
- 홈 카드/모임 상세/추천 카드 넓은 화면 대응
- `bottom-nav` 데스크탑 floating 처리
- `recommendation-card` 가독성 개선
- 모임 상세 2단 CSS 적용

이미 적용한 override는 이 단계에 해당한다.

## Phase 2: 레이아웃 컴포넌트 도입

목표: 화면별 레이아웃 중복 제거.

- `AppLayout` 추가
- `PageHeader` 추가
- `PageBody`, `PageGrid` 추가
- `BottomNav`를 `ResponsiveNav`로 대체
- 모바일/데스크탑 네비게이션 분리

## Phase 3: 정보량 많은 화면 리팩토링

목표: 사용성이 실제로 좋아지는 화면부터 개편.

우선순위:

1. `MeetingDetail`
2. `PersonalView`
3. `PreferencesView`
4. `MeetingList`
5. `HistoryView`
6. `ProfileView`
7. `HomeView`

`MeetingDetail`과 `PersonalView`가 가장 중요하다. 둘 다 추천 결과가 핵심인데, 현재는 조건/요약 정보와 같은 흐름에 섞여 있다.

## Phase 4: 디자인 시스템 정리

목표: 전체 시각 일관성 확보.

- spacing scale 정리
- radius scale 정리
- card shadow 단계화
- button variant 정리
- typography scale 정리
- empty/loading/error state 통일

---

## 10. 권장 최종 구조 예시

최종적으로는 다음 구조가 가장 적합하다.

```txt
src/
  app/
    MukpickApp.tsx
    routes/
    model/
  components/
    layout/
      AppLayout.tsx
      Page.tsx
      ResponsiveNav.tsx
      ActionBar.tsx
    feedback/
    form/
    navigation/
  features/
    home/
      HomeView.tsx
      HomeActionCard.tsx
      RecentMealsPanel.tsx
    recommendations/
      PersonalView.tsx
      RecommendationConditionPanel.tsx
      RecommendationList.tsx
      RecommendationCard.tsx
      FinalChoiceBar.tsx
    meetings/
      MeetingView.tsx
      MeetingList.tsx
      MeetingDetail.tsx
      components/
        MeetingSummaryAside.tsx
        MeetingRecommendationPanel.tsx
        MeetingMemberSelector.tsx
        MeetingEditPanel.tsx
    preferences/
      PreferencesView.tsx
      components/
        PreferenceStepper.tsx
        PreferenceSummaryAside.tsx
    mealHistory/
    profile/
  styles/
    tokens.css
    layout.css
    components.css
    features...
```

---

## 11. 실제 디자인 방향 요약

MUK PICK은 음식 추천 앱이므로 완전한 B2B 대시보드처럼 딱딱하게 가면 안 된다. 다만 지금처럼 모바일 카드 UI를 그대로 키우면 정보 밀도가 낮고, 추천 결과가 덜 중요해 보인다.

권장 디자인 방향은 다음이다.

- 톤: 따뜻한 음식 앱 느낌 유지
- 구조: 웹에서는 생산성 앱처럼 정보 배치
- 핵심 콘텐츠: 추천 결과를 항상 메인 영역에 배치
- 보조 정보: 조건, 모임 정보, 참여자, 설정은 aside로 이동
- 액션: 추천 받기, 다시 계산, 선택 확정은 고정된 위치에 배치
- 모바일: 기존 감성 유지
- 데스크탑: 넓은 카드/2단/3단 레이아웃 사용

---

## 12. 최종 결론

현재 코드는 기능 단위 분리는 되어 있으므로, UI 개편을 위해 상태 관리나 API 구조를 크게 바꿀 필요는 없다. 가장 큰 문제는 **레이아웃 계층 부재**와 **모바일 프레임 중심 설계**다.

따라서 바로 전체 재작성하기보다 다음 순서가 현실적이다.

1. 기존 CSS override로 넓은 화면 대응을 빠르게 확인한다.
2. 느낌이 맞으면 `AppLayout`, `Page`, `ResponsiveNav`를 추가한다.
3. `MeetingDetail`과 `PersonalView`부터 2단 레이아웃으로 JSX를 정리한다.
4. 이후 `PreferencesView`, `MeetingList`, `HistoryView`를 순차적으로 개편한다.
5. 마지막으로 `styles.css`를 feature별 CSS 파일로 분리한다.

이 방식이면 현재 구현된 API 연동, 라우팅, 상태 훅을 유지하면서 UI만 점진적으로 개선할 수 있다.
