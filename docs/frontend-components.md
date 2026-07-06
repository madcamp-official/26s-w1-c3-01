# MUK PICK Frontend Component Design

## 1. 목적

이 문서는 MUK PICK 프론트엔드 컴포넌트 설계 기준을 정의한다. 목표는 `App.tsx`에 집중된 UI를 기능 단위로 분리하고, 반복되는 UI를 일관된 컴포넌트로 재사용하는 것이다.

## 2. 컴포넌트 분류

| 분류 | 설명 | 예시 |
|---|---|---|
| App shell | 앱 전체 레이아웃과 전역 피드백 | header, bottom nav, toast |
| Screen | 한 화면 단위 | StartScreen, HomeView, MeetingView |
| Feature component | 특정 업무 흐름에 종속 | RecommendationList, MeetingCreateDialog |
| Primitive | 업무 지식 없는 공통 UI | Button, Chip, Card, Input, Modal |
| Domain mapper | API 응답을 화면 모델로 변환 | mapRecommendations, mapMeetings |

## 3. 현재 주요 화면 컴포넌트

현재 `App.tsx` 안에 정의된 주요 화면은 다음과 같다.

| 컴포넌트 | 책임 |
|---|---|
| `AuthFlow` | 시작/회원가입/게스트 온보딩 flow 분기 |
| `StartScreen` | 앱 시작 화면 |
| `NicknameStep` | 회원 닉네임 입력 |
| `DisplayNameStep` | 게스트 모임 내 표시 이름 입력 |
| `GuestJoinMeetingScreen` | 게스트 모임 ID 입력 |
| `OnboardingPickStep` | 카테고리/태그/알러지 선택 |
| `RecentPenaltyStep` | 최근 식사 패널티 설정 |
| `SignupCompleteScreen` | 온보딩 완료 요약 |
| `HomeView` | 홈 |
| `PreferencesView` | 단계형 선호도 수정 |
| `PersonalView` | 개인 추천 |
| `MeetingView` | 모임 목록/상세/추천 |
| `MeetingCreateDialog` | 새 모임 생성 |
| `MealHistoryDialog` | 식사 기록 추가 |
| `HistoryView` | 식사 기록 |
| `ProfileView` | 프로필 |
| `RecommendationList` | 추천 랭킹 목록 |

## 4. 목표 컴포넌트 구조

```text
components/
├─ primitives/
│  ├─ Button.tsx
│  ├─ IconButton.tsx
│  ├─ Card.tsx
│  ├─ Chip.tsx
│  ├─ Input.tsx
│  ├─ Modal.tsx
│  └─ Toggle.tsx
├─ navigation/
│  ├─ AppHeader.tsx
│  └─ BottomNav.tsx
├─ feedback/
│  ├─ Toast.tsx
│  ├─ EmptyState.tsx
│  └─ LoadingState.tsx
└─ form/
   ├─ StepNav.tsx
   ├─ PickerGrid.tsx
   └─ ScoreSlider.tsx
```

```text
features/
├─ auth/
│  ├─ StartScreen.tsx
│  ├─ MemberEntryFlow.tsx
│  └─ GuestEntryFlow.tsx
├─ onboarding/
│  ├─ PreferenceStep.tsx
│  └─ RecentPenaltyStep.tsx
├─ home/
│  └─ HomeScreen.tsx
├─ recommendations/
│  ├─ PersonalRecommendationScreen.tsx
│  ├─ RecommendationList.tsx
│  └─ RecommendationConfirmBar.tsx
├─ meetings/
│  ├─ MeetingListScreen.tsx
│  ├─ MeetingDetailScreen.tsx
│  ├─ MeetingCreateDialog.tsx
│  ├─ MeetingMemberChips.tsx
│  └─ MeetingRecommendationPanel.tsx
└─ profile/
   └─ ProfileScreen.tsx
```

## 5. Primitive 설계 기준

### Button

| Variant | 용도 |
|---|---|
| `primary` | 주요 CTA, 추천 받기, 선택 확정 |
| `secondary` | 보조 액션, 다시 계산 |
| `ghost` | 뒤로가기, 관리하기 등 낮은 강조 |
| `danger` | 삭제/로그아웃 등 주의 액션 |

기준:

- 최소 터치 영역은 44px 이상이다.
- loading 상태에서는 중복 클릭을 막는다.
- disabled 상태는 색상과 pointer event를 모두 제어한다.

### Chip

용도:

- 카테고리/태그/알러지 선택
- 모임 구성원 포함/제외
- 상태 표시

기준:

- 선택형 chip은 `aria-pressed`를 제공한다.
- 모임 구성원 제외 상태는 어두운 스타일로 명확히 표현한다.

### Card

용도:

- 추천 메뉴 row/card
- 모임 card
- 식사 기록 card

기준:

- 완료된 모임은 흐리게 표시하고 목록 후반에 배치한다.
- 카드 안에 또 다른 카드를 중첩하지 않는다.
- 모바일 폭에서 텍스트가 버튼을 침범하지 않아야 한다.

### Modal/Dialog

용도:

- 모임 생성
- 식사 기록 추가
- 확인/확정 액션

기준:

- 닫기 버튼과 ESC/외부 클릭 동작 기준을 통일한다.
- 제출 중에는 submit 버튼을 비활성화한다.

## 6. Feature 컴포넌트 설계 기준

### 개인 추천

구성:

- 추천 조건 패널
- 추천 요청 버튼
- 랭킹 리스트
- 선택 상태
- 최종 확정 CTA

규칙:

- 메뉴마다 즉시 기록 버튼을 두지 않는다.
- 후보 하나를 선택한 뒤 최종 확정 버튼으로 식사 기록을 생성한다.
- 추천 이유는 실제 API reason이 있을 때만 표시한다.

### 모임 추천

구성:

- 모임 정보
- 모임 ID 복사
- 구성원 chip 목록
- 추천 랭킹
- 메뉴 확정 CTA

규칙:

- 구성원 chip을 눌러 추천 계산 포함 여부를 변경한다.
- 게스트는 확정 CTA를 볼 수 없거나 비활성 안내를 본다.
- 모임 생성자만 메뉴 확정을 수행한다.

### 선호도 관리

구성:

- 카테고리 단계
- 태그 단계
- 알러지 단계
- 최근 식사 패널티 단계
- 최종 확인 단계

규칙:

- 최초 온보딩과 같은 단계형 UX를 사용한다.
- 한 화면에 모든 입력을 길게 나열하지 않는다.

## 7. Accessibility 기준

- 클릭 가능한 아이콘 버튼은 `aria-label`을 제공한다.
- 선택형 버튼은 `aria-pressed`를 제공한다.
- 모달은 열릴 때 주요 제목 또는 첫 입력으로 focus를 이동한다.
- 색상만으로 상태를 구분하지 않는다.
- 모바일에서 body scroll과 내부 리스트 scroll이 충돌하지 않도록 한다.

## 8. 리팩터링 순서

1. `RecommendationList`, `EmptyState`, `StepNav`를 공통 컴포넌트로 분리한다.
2. `MeetingView`를 목록/상세/생성 dialog로 분리한다.
3. `PreferencesView`와 온보딩 step을 공유 가능한 step 컴포넌트로 통합한다.
4. `map*` 함수들을 `domain/mapper`로 이동한다.
5. `App.tsx`는 flow와 screen composition만 남긴다.

