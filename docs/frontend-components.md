# MUK PICK Frontend Component Design

## 1. 목적

이 문서는 MUK PICK 프론트엔드의 컴포넌트 설계 기준을 정의한다. 현재 프론트엔드는 초기의 `App.tsx` 중심 구조가 아니라, `MukpickApp`이 앱 흐름과 feature hook을 조립하고 `AppScreens`가 화면을 렌더링하는 구조로 분리되어 있다.

이 문서의 목적은 다음과 같다.

* 실제 구현 기준의 컴포넌트 구조 정리
* 공통 컴포넌트와 feature 컴포넌트의 역할 구분
* 화면 컴포넌트와 상태 관리 hook의 책임 분리
* 반복 UI의 재사용 기준 정리
* 추천, 모임, 선호도, 식사 기록 화면의 컴포넌트 설계 기준 정리

---

## 2. 현재 컴포넌트 구조 요약

현재 프론트엔드는 다음 흐름으로 렌더링된다.

```text
main.tsx
  -> App.tsx
    -> app/MukpickApp.tsx
      -> app/routes/AppScreens.tsx
        -> features/* View
          -> components/*
```

각 계층의 역할은 다음과 같다.

| 계층                 | 주요 파일                       | 역할                                       |
| ------------------ | --------------------------- | ---------------------------------------- |
| Entry              | `main.tsx`                  | React 앱을 DOM에 mount                      |
| Root Wrapper       | `App.tsx`                   | `MukpickApp`만 렌더링                        |
| App Orchestration  | `app/MukpickApp.tsx`        | 인증, 선호도, 추천, 모임, 식사 기록, URL sync hook 조립 |
| Screen Composition | `app/routes/AppScreens.tsx` | 현재 tab에 맞는 feature view 렌더링              |
| Feature View       | `features/*`                | 각 업무 화면 UI                               |
| Common Component   | `components/*`              | 레이아웃, 로딩, 빈 상태 등 재사용 UI                  |
| Domain Mapper      | `domain/mapper`             | backend 응답을 화면 표시 모델로 변환                 |

---

## 3. 현재 폴더 기준

```text
frontend/src/
├─ App.tsx
├─ app/
│  ├─ MukpickApp.tsx
│  ├─ app.types.ts
│  ├─ appNavigation.ts
│  ├─ appUtils.ts
│  ├─ useAppUrlSync.ts
│  ├─ model/
│  └─ routes/
│     ├─ appRoutes.ts
│     └─ AppScreens.tsx
├─ api/
├─ components/
│  ├─ feedback/
│  └─ layout/
├─ domain/
│  └─ mapper/
├─ features/
│  ├─ auth/
│  ├─ home/
│  ├─ mealHistory/
│  ├─ meetings/
│  ├─ preferences/
│  ├─ profile/
│  └─ recommendations/
├─ types/
├─ utils/
└─ styles.css
```

---

## 4. 컴포넌트 분류

| 분류                 | 위치                           | 설명                   | 예시                                         |
| ------------------ | ---------------------------- | -------------------- | ------------------------------------------ |
| App shell          | `app/`, `components/layout/` | 앱 전체 흐름, 레이아웃, 탭 구조  | `MukpickApp`, `AppScreens`, `AppLayout`    |
| Screen View        | `features/*/*View.tsx`       | 한 화면 단위 UI           | `HomeView`, `PersonalView`, `MeetingView`  |
| Feature Dialog     | `features/*/*Dialog.tsx`     | 특정 기능에 종속된 dialog    | `MeetingCreateDialog`, `MealHistoryDialog` |
| Feature List/Panel | `features/*`                 | 특정 업무 흐름에 종속된 UI 조각  | `RecommendationList`                       |
| Feedback Component | `components/feedback/`       | 공통 피드백 UI            | `LoadingOverlay`, `EmptyState`             |
| Layout Component   | `components/layout/`         | 공통 화면 레이아웃           | `AppLayout`, `Page`, `PageGrid`            |
| Domain Mapper      | `domain/mapper`              | API 응답을 화면 표시 모델로 변환 | recommendation, meeting, history mapper    |

---

## 5. 주요 App Shell 컴포넌트

### 5.1 `App.tsx`

`App.tsx`는 현재 UI 상태나 API 호출을 직접 들고 있지 않다. `MukpickApp`만 렌더링하는 thin wrapper이다.

책임:

* 앱 루트 컴포넌트 연결
* 직접적인 화면 상태 관리 없음
* 직접적인 API 호출 없음
* 직접적인 화면 분기 없음

기준:

```tsx
import { MukpickApp } from "./app/MukpickApp";

export function App() {
  return <MukpickApp />;
}
```

---

### 5.2 `MukpickApp.tsx`

`MukpickApp`은 현재 프론트엔드의 핵심 orchestration 컴포넌트이다.

책임:

* 인증 flow 관리
* 세션 복원
* 사용자 프로필 로딩
* master data 로딩
* 선호도 상태 조립
* 개인 추천 상태 조립
* 모임 상태 조립
* 식사 기록 상태 조립
* URL state sync 연결
* toast 상태 관리
* 전역 loading 상태 계산
* 인증 만료 처리
* `AuthFlow`와 `AppScreens` 렌더링 분기

기준:

* 화면별 세부 UI를 직접 많이 작성하지 않는다.
* 기능별 상태와 액션은 `features/*/use*.ts` hook에 위임한다.
* 앱 전체에서 공유되는 상태와 action handler를 연결하는 역할에 집중한다.
* `AppScreens`에 필요한 props를 전달한다.
* 인증 세션 만료 시 앱 상태를 안전하게 reset한다.

---

### 5.3 `AppScreens.tsx`

`AppScreens`는 앱 내부 화면을 렌더링하는 screen composition 계층이다.

현재 lazy loading 대상:

```text
HomeView
PreferencesView
PersonalView
MeetingView
HistoryView
ProfileView
MeetingCreateDialog
```

책임:

* `AppLayout` 렌더링
* 현재 `visibleTab`에 맞는 feature view 렌더링
* lazy-loaded 화면에 `Suspense` fallback 제공
* 모임 생성 dialog overlay 렌더링
* 각 feature view에 상태와 action handler 전달

기준:

* API를 직접 호출하지 않는다.
* 상태 계산을 직접 많이 하지 않는다.
* 현재 tab에 맞는 view를 조립하는 역할에 집중한다.
* `AppScreensProps`가 지나치게 커지면 tab별 screen container로 추가 분리할 수 있다.

---

## 6. 공통 컴포넌트 기준

### 6.1 `components/layout`

앱 전체 레이아웃과 화면 단위 레이아웃을 담당한다.

예시:

```text
components/layout/
├─ AppLayout
├─ Page
└─ PageGrid
```

역할:

* 공통 앱 프레임 구성
* 모바일 중심 화면 폭 관리
* 하단 탭 또는 앱 기본 레이아웃 제공
* 화면 title/description 배치
* grid 기반 화면 배치

설계 기준:

* 특정 feature의 API 상태에 직접 의존하지 않는다.
* feature별 business logic을 포함하지 않는다.
* props로 받은 상태와 handler만 사용한다.
* 모바일 화면에서 overflow가 깨지지 않도록 한다.

---

### 6.2 `components/feedback`

사용자 피드백 UI를 담당한다.

예시:

```text
components/feedback/
├─ LoadingOverlay
└─ EmptyState
```

역할:

* 전역 loading 표시
* lazy loading fallback 표시
* 데이터가 없을 때 empty state 표시
* 사용자에게 다음 행동을 안내하는 메시지 제공

설계 기준:

* loading 중에는 중복 클릭을 방지할 수 있어야 한다.
* empty state는 단순히 “없음”만 보여주지 않고 다음 액션을 안내한다.
* API 실패와 빈 데이터 상태를 구분한다.
* 화면 전체를 막는 loading과 영역 단위 loading을 구분해서 사용한다.

---

## 7. Feature 컴포넌트 기준

### 7.1 `features/auth`

인증과 온보딩 화면을 담당한다.

주요 역할:

* 시작 화면
* 이메일 로그인
* 이메일 회원가입
* 회원가입 인증 안내
* Google OAuth 진입
* OAuth 신규 사용자 닉네임 온보딩
* 게스트 시작
* 게스트 선호도 입력
* 게스트 모임 preview
* 게스트 표시 이름 입력

주요 컴포넌트/hook:

```text
features/auth/
├─ AuthFlow.tsx
├─ useAuthActions.ts
├─ useAuthFlowState.ts
├─ useAuthProfile.ts
└─ useSessionRestore.ts
```

설계 기준:

* 인증 화면의 flow 분기는 `AuthFlow`에서 처리한다.
* 인증 API 호출은 `useAuthActions`에서 처리한다.
* 로그인/회원가입 입력 상태는 `useAuthFlowState`에서 관리한다.
* 새로고침 후 세션 복원은 `useSessionRestore`에서 처리한다.
* OAuth 신규 사용자는 닉네임 입력 후 profile sync를 수행한다.
* 게스트는 일반 회원과 달리 특정 모임 참여 흐름 중심으로 이동한다.

---

### 7.2 `features/home`

홈 화면을 담당한다.

주요 역할:

* 개인 추천 진입
* 모임 화면 진입
* 식사 기록 진입
* 최근 식사 기록 요약
* 선호도 기반 홈 정보 표시
* 참여 중인 모임 개수 표시

주요 컴포넌트:

```text
features/home/
└─ HomeView.tsx
```

설계 기준:

* 홈에서는 복잡한 입력을 받지 않는다.
* 주요 기능으로 빠르게 이동할 수 있는 CTA를 제공한다.
* 최근 기록이나 모임 개수처럼 현재 상태를 간단히 요약한다.
* 실제 데이터 생성/수정은 각 feature 화면으로 이동해 처리한다.

---

### 7.3 `features/preferences`

선호도 설정 화면을 담당한다.

주요 역할:

* 카테고리 선택
* 태그 선택
* 알러지/제한 조건 선택
* 카테고리 점수 설정
* 태그 점수 설정
* 최근 식사 중복 패널티 설정
* 예산 조건 설정
* 선호도 저장

주요 컴포넌트/hook:

```text
features/preferences/
├─ PreferencesView.tsx
├─ usePreferenceSettings.ts
└─ usePreferenceSaveAction.ts
```

설계 기준:

* `PreferencesView`는 UI 렌더링에 집중한다.
* 선택 상태와 점수 상태는 `usePreferenceSettings`에서 관리한다.
* 저장 API 호출은 `usePreferenceSaveAction`에서 처리한다.
* 온보딩과 마이페이지 수정 화면에서 같은 선호도 구조를 재사용할 수 있어야 한다.
* 예산 조건은 단일 가격대 선택 UI에서는 `budgetMin`과 `budgetMax`를 같은 값으로 저장할 수 있다.
* 저장 중에는 저장 버튼을 비활성화한다.

---

### 7.4 `features/recommendations`

개인 메뉴 추천 화면을 담당한다.

주요 역할:

* 최근 식사 중복 패널티 조건 선택
* 예산 조건 선택
* 개인 추천 요청
* 추천 결과 랭킹 표시
* 추천 메뉴 선택
* 선택 메뉴 최종 확정
* 확정된 추천 메뉴를 식사 기록으로 저장
* 메뉴 조회 또는 선택 상호작용 기록

주요 컴포넌트/hook:

```text
features/recommendations/
├─ PersonalView.tsx
├─ RecommendationList.tsx
├─ budgetOptions.ts
├─ usePersonalRecommendations.ts
└─ usePersonalRecommendationActions.ts
```

설계 기준:

* `PersonalView`는 추천 조건 패널과 추천 결과 영역을 렌더링한다.
* `RecommendationList`는 개인 추천과 모임 추천에서 함께 사용할 수 있는 랭킹 리스트로 유지한다.
* 추천 결과는 카드 또는 row 형태로 보여준다.
* 사용자는 후보 하나를 먼저 선택하고, 별도의 “선택 확정” 버튼으로 식사 기록을 생성한다.
* 추천 결과를 보는 것만으로 식사 기록을 생성하지 않는다.
* 확정 시 `meal-history` 생성과 `pick` 상호작용 기록을 수행한다.
* 추천 요청 중에는 추천 버튼을 비활성화한다.
* 확정 저장 중에는 확정 버튼을 비활성화한다.

개인 추천 화면 구성:

```text
PersonalView
├─ condition panel
│  ├─ recent duplicate days select
│  ├─ budget level select
│  └─ refresh button
└─ result main
   ├─ RecommendationList
   └─ final choice bar
```

---

### 7.5 `features/meetings`

모임 목록, 모임 상세, 모임 생성, 모임 추천, 메뉴 확정 흐름을 담당한다.

주요 역할:

* 모임 생성
* 모임 목록 조회
* 모임 상세 조회
* 게스트 모임 preview
* 게스트 모임 참여
* 모임 정보 수정
* 참여자 목록 표시
* 추천 계산에 포함할 참여자 선택
* 모임 추천 생성
* 최신 모임 추천 결과 조회
* 추천 메뉴 선택
* 최종 메뉴 확정

주요 컴포넌트/hook:

```text
features/meetings/
├─ MeetingView.tsx
├─ MeetingCreateDialog.tsx
├─ useMeetings.ts
├─ useMeetingActions.ts
├─ useMeetingSessionSync.ts
└─ useSelectedMeetingPolling.ts
```

설계 기준:

* `MeetingView`는 목록/상세/추천 결과를 렌더링한다.
* `MeetingCreateDialog`는 모임 생성 form만 담당한다.
* API 호출과 상태 갱신은 `useMeetingActions`에서 처리한다.
* 모임 상세 상태와 추천 결과 상태는 `useMeetings`에서 관리한다.
* 게스트 세션과 선택된 모임 동기화는 `useMeetingSessionSync`에서 처리한다.
* 모임 상세 polling은 `useSelectedMeetingPolling`에서 처리한다.
* 모임 생성자만 최종 메뉴 확정 버튼을 사용할 수 있다.
* 게스트는 추천 결과 확인은 가능하지만 메뉴 확정은 할 수 없다.
* 참여자 chip을 눌러 추천 계산 포함 여부를 조정한다.
* 제외된 참여자는 `participantUserIds`에서 빠진다.

모임 화면 구성:

```text
MeetingView
├─ meeting list
├─ selected meeting detail
│  ├─ meeting summary
│  ├─ participant chips
│  ├─ recommendation action
│  ├─ RecommendationList
│  └─ decide menu action
└─ guest join form or guide
```

---

### 7.6 `features/mealHistory`

식사 기록 화면과 식사 기록 관련 action을 담당한다.

주요 역할:

* 식사 기록 목록 조회
* 식사 기록 생성
* 식사 기록 수정
* 식사 기록 삭제
* 만족도와 메모 표시
* 메뉴 좋아요/싫어요/북마크 토글
* 식사 기록 표시 모델 변환

주요 컴포넌트/hook:

```text
features/mealHistory/
├─ HistoryView.tsx
├─ MealHistoryDialog.tsx
├─ useMealHistories.ts
└─ useMealHistoryActions.ts
```

설계 기준:

* `HistoryView`는 식사 기록 목록과 수정/삭제/상호작용 UI를 렌더링한다.
* 식사 기록 생성/수정 form은 `MealHistoryDialog`가 담당한다.
* 기록 목록 상태는 `useMealHistories`에서 관리한다.
* 생성/수정/삭제 API 호출은 `useMealHistoryActions`에서 처리한다.
* 좋아요/싫어요/북마크 토글 성공 후 해당 item의 interaction state를 즉시 갱신한다.
* 좋아요와 싫어요가 동시에 활성화되지 않도록 한다.
* 삭제 액션은 사용자가 실수하지 않도록 명확한 UI로 제공한다.

---

### 7.7 `features/profile`

프로필 화면을 담당한다.

주요 역할:

* 사용자 이름 표시
* 사용자 ID 표시
* 선호도 요약
* 식사 기록 수 표시
* 선호도 설정 화면 이동
* 로그아웃

주요 컴포넌트:

```text
features/profile/
└─ ProfileView.tsx
```

설계 기준:

* 복잡한 수정 form은 최소화한다.
* 사용자가 현재 계정 상태를 확인할 수 있어야 한다.
* 로그아웃 버튼은 다른 일반 CTA와 시각적으로 구분한다.
* 로그아웃 중에는 중복 클릭을 막는다.

---

## 8. Domain Mapper 기준

`domain/mapper`는 backend 응답을 화면 표시 모델로 변환한다.

역할:

* backend 응답의 snake_case/camelCase 차이 흡수
* nullable 필드 처리
* 추천 결과 display model 생성
* 모임 display model 생성
* 식사 기록 display model 생성
* master data display model 생성
* 메뉴 상호작용 상태를 화면 모델에 반영

설계 기준:

* view 컴포넌트는 backend 원본 응답 구조에 직접 의존하지 않는다.
* API 응답 구조 변경의 영향은 mapper 계층에서 최대한 흡수한다.
* `any` 사용은 mapper 경계에서 제한적으로만 허용한다.
* 화면에서 필요한 `menu`, `score`, `reason`, `tags`, `status` 등의 값은 mapper를 거쳐 정규화한다.

---

## 9. 공통 UI 패턴

### 9.1 Button

용도:

* 추천 받기
* 다시 추천 받기
* 선택 확정
* 저장
* 수정
* 삭제
* 로그아웃
* 모임 생성

기준:

* 최소 터치 영역은 44px 이상으로 유지한다.
* loading 중에는 중복 클릭을 막는다.
* disabled 상태는 색상과 pointer event를 함께 제어한다.
* 위험 액션은 일반 CTA와 시각적으로 구분한다.
* 버튼 텍스트는 사용자가 액션 결과를 예측할 수 있게 작성한다.

---

### 9.2 Chip

용도:

* 카테고리 선택
* 태그 선택
* 알러지 선택
* 모임 구성원 포함/제외
* 추천 이유 태그
* 상태 표시

기준:

* 선택 가능한 chip은 선택 상태를 명확히 표시한다.
* 구성원 제외 상태는 포함 상태와 구분되게 표시한다.
* 가능하면 `aria-pressed`를 제공한다.
* 너무 긴 텍스트는 모바일 폭에서 overflow되지 않게 처리한다.

---

### 9.3 Card

용도:

* 추천 메뉴 카드
* 모임 카드
* 식사 기록 카드
* 프로필 요약 카드

기준:

* 카드 안에 또 다른 카드를 과도하게 중첩하지 않는다.
* 모바일 폭에서 텍스트가 버튼 영역을 침범하지 않도록 한다.
* 선택 가능한 카드는 선택 상태가 명확해야 한다.
* 완료된 모임 또는 확정된 상태는 일반 상태와 구분한다.
* 점수, 이유, 상태값은 같은 카드 안에서 우선순위가 드러나게 배치한다.

---

### 9.4 Modal / Dialog

용도:

* 모임 생성
* 식사 기록 추가/수정
* 중요 액션 확인

기준:

* 열림/닫힘 상태는 상위 feature state에서 관리한다.
* submit 중에는 버튼을 비활성화한다.
* 닫기 버튼을 명확히 제공한다.
* 모바일 화면에서 dialog 높이가 넘치면 내부 scroll을 제공한다.
* 저장 실패 시 dialog가 닫히지 않고 오류를 확인할 수 있어야 한다.

---

### 9.5 Empty State

용도:

* 추천 결과 없음
* 식사 기록 없음
* 모임 없음
* 검색 또는 조건에 맞는 데이터 없음

기준:

* 단순히 “없음”만 보여주지 않는다.
* 사용자가 다음에 할 수 있는 행동을 안내한다.
* 예: “추천을 시작해 보세요”, “모임을 생성해 보세요”, “식사 기록을 추가해 보세요”.

---

### 9.6 Loading State

용도:

* 앱 초기 데이터 로딩
* lazy-loaded 화면 로딩
* 추천 생성 중
* 모임 생성/확정 중
* 식사 기록 저장 중
* 선호도 저장 중

기준:

* 전역 blocking이 필요한 경우 `LoadingOverlay`를 사용한다.
* 화면 일부만 갱신하는 경우 버튼 loading 또는 영역 loading으로 처리한다.
* loading 중 중복 요청을 막는다.
* 사용자가 현재 작업이 진행 중임을 이해할 수 있는 문구를 제공한다.

---

## 10. 화면별 설계 기준

### 10.1 Auth / Onboarding

구성:

```text
AuthFlow
├─ start
├─ login
├─ signup
├─ email sent
├─ oauth nickname
├─ member preference steps
├─ guest preference steps
├─ guest meeting preview
└─ guest display name
```

기준:

* 회원과 게스트 flow를 구분한다.
* OAuth 신규 사용자는 이메일/비밀번호를 다시 입력하지 않고 닉네임 온보딩으로 이동한다.
* 게스트는 기본 선호도 입력 후 모임 ID 입력으로 이어진다.
* 표시 이름은 모임 안에서만 쓰이는 값임을 UI에서 명확히 한다.
* 인증 오류는 사용자가 다시 시도할 수 있는 메시지로 표시한다.

---

### 10.2 Preferences

구성:

```text
PreferencesView
├─ category section
├─ tag section
├─ allergy section
├─ score controls
├─ recent duplicate days control
├─ budget control
└─ save action
```

기준:

* 한 화면에 모든 입력이 지나치게 길게 늘어지지 않도록 section을 나눈다.
* 카테고리/태그/알러지는 선택 상태가 분명해야 한다.
* 점수형 입력은 0~5 범위를 유지한다.
* 예산 조건은 추천 화면과 일관된 선택지를 사용한다.
* 저장 중에는 저장 버튼을 비활성화한다.
* 저장 완료 후 toast를 표시한다.

---

### 10.3 Personal Recommendation

구성:

```text
PersonalView
├─ condition panel
│  ├─ recent duplicate days
│  ├─ budget level
│  └─ refresh button
└─ result main
   ├─ empty state
   ├─ RecommendationList
   └─ final choice bar
```

기준:

* 추천 요청 전에는 empty state를 보여준다.
* 추천 결과가 있으면 랭킹 리스트를 보여준다.
* 사용자는 추천 메뉴 중 하나를 선택한 뒤 최종 확정한다.
* 최종 확정 전에는 식사 기록을 생성하지 않는다.
* 확정 후 식사 기록 화면으로 이동할 수 있다.
* 추천 요청 중에는 “추천 계산 중” 상태를 표시한다.

---

### 10.4 Meeting

구성:

```text
MeetingView
├─ meeting list
├─ meeting detail
├─ participant chips
├─ recommendation controls
├─ RecommendationList
├─ selected recommendation state
└─ decide menu action
```

기준:

* 모임 목록과 모임 상세 상태를 구분한다.
* 선택된 모임이 없을 때는 안내 UI를 제공한다.
* 모임 생성 dialog는 `MeetingCreateDialog`에서 처리한다.
* 참여자 chip은 추천 계산 포함/제외 상태를 표현한다.
* 모임 추천 결과는 `RecommendationList`를 재사용한다.
* 모임 생성자만 최종 메뉴 확정 버튼을 사용할 수 있다.
* 게스트에게는 확정 권한이 없음을 UI로 명확히 한다.
* 확정된 모임은 상태가 명확히 표시되어야 한다.

---

### 10.5 Meal History

구성:

```text
HistoryView
├─ history list
├─ history item
│  ├─ menu name
│  ├─ eaten date
│  ├─ rating
│  ├─ memo
│  └─ interaction buttons
└─ MealHistoryDialog
```

기준:

* 식사 기록이 없으면 empty state를 보여준다.
* 수정/삭제 액션은 각 기록 item에서 접근 가능해야 한다.
* 좋아요/싫어요/북마크는 현재 상태가 명확해야 한다.
* 좋아요와 싫어요는 동시에 켜지지 않아야 한다.
* 삭제 후 목록이 즉시 갱신되어야 한다.

---

### 10.6 Profile

구성:

```text
ProfileView
├─ user summary
├─ preference summary
├─ history summary
├─ go preferences action
└─ logout action
```

기준:

* 사용자가 현재 로그인한 계정을 쉽게 확인할 수 있어야 한다.
* 선호도 수정으로 이동하는 액션을 제공한다.
* 로그아웃은 위험/주의 액션으로 구분한다.
* 로그아웃 후 세션과 UI state가 정리되어야 한다.

---

## 11. Accessibility 기준

* 클릭 가능한 아이콘 버튼은 `aria-label`을 제공한다.
* 선택형 버튼 또는 chip은 가능하면 `aria-pressed`를 제공한다.
* 색상만으로 상태를 구분하지 않는다.
* loading 중인 버튼은 disabled 처리한다.
* 모달이 열릴 때 사용자가 맥락을 잃지 않도록 제목과 닫기 버튼을 제공한다.
* 모바일에서 body scroll과 내부 리스트 scroll이 충돌하지 않도록 한다.
* 텍스트 대비가 낮아지지 않도록 한다.
* 버튼과 입력 요소의 터치 영역은 충분히 크게 유지한다.

---

## 12. 스타일 관리 기준

현재 스타일은 `frontend/src/styles.css` 중심으로 관리한다.

기준:

* 공통 레이아웃 스타일과 feature 스타일을 구분해서 작성한다.
* 동일한 버튼/카드/chip 스타일을 중복 정의하지 않는다.
* 모바일 화면 기준으로 먼저 확인한다.
* 화면 높이가 작은 환경에서도 주요 CTA가 잘리지 않게 한다.
* dialog 내부 scroll과 page scroll이 충돌하지 않도록 한다.
* 추천 카드, 모임 카드, 식사 기록 카드의 여백과 버튼 위치를 일관되게 유지한다.

향후 스타일이 더 커질 경우 다음 방식으로 분리할 수 있다.

```text
styles/
├─ base.css
├─ layout.css
├─ components.css
└─ features.css
```

현재 단계에서는 단일 `styles.css`를 유지하되, section 주석과 class naming을 일관되게 관리한다.

---

## 13. 컴포넌트 작업 원칙

새로운 UI를 추가할 때는 다음 순서를 따른다.

1. 해당 UI가 특정 feature 전용인지 공통 UI인지 판단한다.
2. feature 전용이면 `features/{domain}` 아래에 둔다.
3. 여러 화면에서 반복되면 `components/*`로 분리한다.
4. API 응답을 직접 화면에 넘기지 않고 `domain/mapper`를 거친다.
5. API 호출은 view 컴포넌트가 아니라 feature action hook에서 처리한다.
6. loading, error, empty, success 상태를 함께 고려한다.
7. 모바일 화면에서 버튼 위치와 overflow를 확인한다.

---

## 14. 리팩터링 기준

현재 구조는 기능별로 상당 부분 분리되어 있지만, 다음 기준으로 추가 리팩터링을 진행할 수 있다.

### 14.1 `AppScreens` props 축소

`AppScreens`가 많은 props를 받고 있으므로, 화면별 container를 추가하면 props 전달을 줄일 수 있다.

예시:

```text
app/routes/
├─ AppScreens.tsx
├─ HomeScreenContainer.tsx
├─ PersonalScreenContainer.tsx
├─ MeetingScreenContainer.tsx
├─ HistoryScreenContainer.tsx
└─ ProfileScreenContainer.tsx
```

단, 현재 규모에서는 `AppScreens`가 화면 조립 계층으로 동작하므로 필수 리팩터링은 아니다.

---

### 14.2 공통 입력 컴포넌트 정리

현재 여러 feature에서 select, button, chip, card 패턴이 반복될 수 있다. 반복이 3회 이상 발생하면 공통 컴포넌트화를 검토한다.

후보:

```text
components/form/
├─ SelectField.tsx
├─ TextField.tsx
├─ ScoreControl.tsx
└─ StepControls.tsx
```

---

### 14.3 추천 카드 공통화

개인 추천과 모임 추천은 모두 `RecommendationList`를 사용할 수 있다. 추천 결과 표시 UI를 유지보수하기 위해 다음 기준을 유지한다.

* 공통 필드: 메뉴명, 점수, 추천 이유, 태그, 선택 상태
* 개인 추천 전용: 최종 식사 기록 저장
* 모임 추천 전용: 모임 최종 메뉴 확정
* 권한 차이: 게스트 확정 불가, 모임 생성자만 확정 가능

---

### 14.4 Dialog 공통 기준 정리

모임 생성, 식사 기록 추가/수정 등 dialog가 늘어나면 공통 dialog shell을 만들 수 있다.

후보:

```text
components/layout/DialogShell.tsx
```

공통 처리:

* 제목
* 닫기 버튼
* footer action
* submit loading
* mobile scroll
* backdrop click

---

## 15. 검증 체크리스트

컴포넌트 수정 후 다음 항목을 확인한다.

* 시작 화면이 정상 표시되는가
* 로그인/회원가입/Google OAuth/게스트 flow가 깨지지 않는가
* 선호도 설정 화면에서 카테고리, 태그, 알러지, 예산, 최근 식사 패널티가 정상 표시되는가
* 개인 추천 화면에서 추천 전 empty state가 보이는가
* 개인 추천 생성 후 `RecommendationList`가 정상 표시되는가
* 추천 메뉴 선택 후 최종 선택 bar가 정상 동작하는가
* 개인 추천 확정 시 식사 기록으로 이동하는가
* 모임 생성 dialog가 정상 열리고 닫히는가
* 모임 상세에서 참여자 chip 포함/제외 상태가 명확한가
* 모임 추천 결과가 정상 표시되는가
* 게스트에게 메뉴 확정 CTA가 노출되지 않거나 비활성 안내가 표시되는가
* 식사 기록 수정/삭제/상호작용 토글이 정상 동작하는가
* 프로필 화면에서 로그아웃이 정상 동작하는가
* loading 중 버튼 중복 클릭이 막히는가
* empty/error/loading 상태가 각각 구분되는가
* 모바일 폭에서 주요 버튼과 카드가 잘리지 않는가

---

## 16. 요약

현재 MUK PICK 프론트엔드는 `App.tsx` 중심 구조가 아니라 `MukpickApp`이 앱 상태와 feature hook을 조립하고, `AppScreens`가 lazy-loaded feature view를 렌더링하는 구조이다. 공통 UI는 `components/feedback`과 `components/layout`에 두고, 인증, 홈, 선호도, 개인 추천, 모임, 식사 기록, 프로필은 `features/*` 아래에서 관리한다.

컴포넌트 설계의 핵심은 view와 action hook을 분리하고, API 응답은 `domain/mapper`에서 화면 표시 모델로 변환하며, 공통 UI 패턴은 중복을 줄여 일관된 모바일 경험을 유지하는 것이다.