# MUK PICK Frontend Architecture

## 1. 목적

이 문서는 React + Vite 기반 MUK PICK 프론트엔드의 구현 기준을 정의한다. 기능명세서가 사용자 관점의 요구사항을 설명한다면, 이 문서는 프론트엔드 개발자가 코드 작업 전에 알아야 하는 구조, 책임 분리, 상태 관리, API 연동, 검증 기준을 다룬다.

## 2. 현재 기술 스택

| 영역 | 기준 |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | `frontend/src/styles.css` 단일 CSS 중심 |
| Icon | `lucide-react` |
| API | Express backend `/api/v1` |
| Auth | Supabase Auth access token을 프론트에서 보관 후 Bearer token으로 전달 |
| Routing | 현재 활성 구조는 `App.tsx` 내부 상태 기반 모바일 앱 흐름 + 주요 URL 상태 동기화 |

## 3. 현재 진입점

현재 실제 렌더링 진입점은 `frontend/src/main.tsx`이다.

```tsx
import { App } from "./App";
```

기존 React Router 기반 `frontend/src/routes/AppRouter.tsx`는 제거되었다. 새 작업의 기준은 `App.tsx`와 `frontend/src/app/appNavigation.ts`의 URL 계약이다.

## 4. 레이어 구조

```text
frontend/src/
├─ main.tsx                  # React app mount
├─ App.tsx                   # 현재 모바일 앱 shell, flow, screen composition
├─ app/appNavigation.ts      # 활성 shell URL <-> state mapping
├─ styles.css                # 현재 전체 UI 스타일
├─ api/                      # backend API wrapper
├─ utils/storage.ts          # token/session metadata storage
├─ assets.ts                 # Supabase/public asset URL mapping
├─ data.ts                   # fallback master data
├─ features/                 # 활성 feature views와 일부 legacy route page modules
└─ components/               # 기존 공통 컴포넌트
```

## 5. 현재 구현 책임

`App.tsx`는 현재 다음 책임을 동시에 갖고 있다.

- 인증/게스트 시작 흐름
- 선호도 온보딩 흐름
- 홈/모임/프로필 하단 탭 전환
- API 응답을 UI 표시 모델로 변환
- 개인 추천과 식사 기록 생성
- 모임 생성, 참여, 추천 계산, 메뉴 확정
- toast, loading, error 상태 표시
- 화면 컴포넌트 정의

이 구조는 초기 구현 속도에는 유리하지만, 다음 개발 단계에서는 유지보수 비용이 크다. 이후 구현은 아래 목표 구조로 점진 분리한다.

## 6. 목표 구조

```text
frontend/src/
├─ app/
│  ├─ App.tsx
│  ├─ AppShell.tsx
│  ├─ app.types.ts
│  └─ useAppBootstrap.ts
├─ features/
│  ├─ auth/
│  ├─ onboarding/
│  ├─ home/
│  ├─ recommendations/
│  ├─ meetings/
│  ├─ meal-history/
│  └─ profile/
├─ components/
│  ├─ navigation/
│  ├─ feedback/
│  ├─ form/
│  └─ primitives/
├─ api/
├─ domain/
│  ├─ mapper/
│  └─ model/
└─ styles/
```

## 7. 분리 원칙

| 구분 | 책임 |
|---|---|
| `api/*` | HTTP endpoint 호출만 담당한다. UI 모델 변환을 넣지 않는다. |
| `domain/mapper/*` | backend 응답을 화면 표시 모델로 변환한다. |
| `features/*` | 특정 업무 흐름과 화면 상태를 담당한다. |
| `components/*` | 업무 지식이 없는 재사용 UI를 담당한다. |
| `utils/storage.ts` | localStorage/session metadata 접근을 캡슐화한다. |
| `App.tsx` | 전역 흐름 조립만 담당한다. 대형 화면 구현을 직접 갖지 않는다. |

## 8. 프론트 상태 종류

| 상태 | 저장 위치 | 설명 |
|---|---|---|
| access token | `localStorage` | API 인증에 사용 |
| session meta | `localStorage` | 게스트 여부, 참여 모임 ID, displayName |
| app UI state | `localStorage` + URL | active tab, 모임 상세, 선택 중인 추천 후보 복원 |
| active tab | React state + URL | 홈/모임/프로필 탭 |
| auth/onboarding flow | React state | 시작, 회원가입, 게스트, 온보딩 단계 |
| master data | React state + fallback | 카테고리/태그/알러지/메뉴 |
| recommendation result | React state | 개인 또는 모임 추천 랭킹 |
| selected recommendation | React state | 최종 확정 전 사용자가 선택한 후보 |

새로고침 후 복원이 필요한 상태는 `storage.ts`와 URL을 통해 저장한다. URL이 있으면 URL을 우선하고, URL에 선택 정보가 없으면 `appUiStateStorage`를 fallback으로 사용한다.

## 9. API 연동 원칙

- 모든 API 호출은 `apiRequest`를 거친다.
- 인증이 필요한 요청은 access token을 `Authorization: Bearer`로 전달한다.
- `VITE_API_BASE_URL`이 없으면 기본값 `/api/v1`을 사용한다.
- API가 JSON이 아닌 HTML을 반환하면 사용자에게 backend URL 또는 배포 환경변수 문제로 안내한다.
- 화면은 loading, error, empty, success 상태를 모두 가진다.

## 10. 코드 작업 기준

- 새 기능은 가능한 한 `App.tsx`에 직접 추가하지 않는다.
- 반복되는 버튼, 카드, 칩, 입력, 모달은 공통 컴포넌트로 분리한다.
- API 응답 필드명 차이는 mapper에서 흡수한다.
- `any` 사용은 backend 응답 호환이 필요한 mapper 경계에 한정한다.
- 긴 리스트나 반복 계산에는 `Set`, `Map`, memoization을 우선 고려한다.
- 화면 전환과 저장 같은 사용자 액션은 성공/실패 피드백을 제공한다.

## 11. 구현 우선순위

1. `App.tsx`의 mapper/helper 함수를 `domain/mapper`로 분리한다.
2. 인증/온보딩 흐름을 `features/auth`, `features/onboarding`으로 분리한다.
3. 개인 추천과 모임 추천 화면을 feature 단위로 분리한다.
4. 공통 UI primitive를 정리한다.
5. legacy route page modules 중 활성 모바일 shell과 중복되는 파일을 점진 제거하거나 새 feature view로 이관한다.
