# MUK PICK Frontend API and State Contract

## 1. 목적

이 문서는 프론트엔드가 backend API, 인증 토큰, 게스트 세션, 추천 결과, 로딩/에러 상태를 어떻게 다루는지 정의한다.

## 2. API client 기준

모든 API 호출은 `frontend/src/api/client.ts`의 `apiRequest`를 통해 수행한다.

```text
VITE_API_BASE_URL + path
```

기본값:

```text
/api/v1
```

로컬 Vite 개발 서버는 `frontend/vite.config.ts`에서 `/api`를 `http://127.0.0.1:3000`으로 proxy한다.

## 3. 배포 환경 변수

프론트엔드만 별도 배포할 경우 반드시 다음 환경 변수를 설정한다.

```text
VITE_API_BASE_URL=https://{backend-domain}/api/v1
VITE_SUPABASE_URL=https://{project-ref}.supabase.co
VITE_SUPABASE_ANON_KEY={supabase-anon-or-publishable-key}
```

이 값이 없고 같은 도메인에 backend가 없다면 `/api/v1` 요청이 HTML 문서를 반환할 수 있다. 프론트는 이 경우 JSON 파싱 에러 대신 API 서버 설정 문제로 안내한다.

`VITE_SUPABASE_ANON_KEY`는 브라우저에서 사용하는 공개 anon/publishable key다. `service_role` key는 절대 프론트 환경변수에 넣지 않는다.

## 4. API 응답 포맷

프론트는 backend 응답을 다음 형태로 기대한다.

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
  };
};
```

`success = false`이면 `error.message`를 사용자에게 전달 가능한 에러 메시지로 사용한다.

## 5. 인증 토큰

| 항목 | 기준 |
|---|---|
| 저장 위치 | `localStorage` |
| key | `mukpick.accessToken` |
| 전달 방식 | `Authorization: Bearer {token}` |
| refresh 방식 | 만료 전 또는 401 응답 시 `POST /auth/refresh` |
| 삭제 시점 | 로그아웃, refresh 실패, 세션 초기화 |

인증이 필요 없는 요청은 `apiRequest(path, { auth: false })`로 호출한다.

## 6. 세션 메타데이터

`frontend/src/utils/storage.ts`의 `sessionStorageMeta`는 사용자 세션의 프론트 보조 정보를 저장한다.

```ts
type SessionMeta = {
  isGuest: boolean;
  meetingId?: number;
  displayName?: string;
};
```

| 필드 | 설명 |
|---|---|
| `isGuest` | 게스트 세션 여부 |
| `meetingId` | 게스트가 참여한 모임 ID |
| `displayName` | 모임 안에서 표시할 이름 |

게스트 세션은 앱 전체 탐색이 아니라 특정 모임 참여에 묶인다.

## 7. 주요 API 모듈

| 파일 | 책임 |
|---|---|
| `auth.api.ts` | signup, login, refresh, nickname availability, guest, logout |
| `oauth.api.ts` | Supabase SDK 기반 Kakao/Google OAuth 시작, callback token parsing |
| `users.api.ts` | 내 정보, 사용자 목록, 프로필 수정 |
| `masterData.api.ts` | 메뉴, 카테고리, 태그, 알러지, 모임 목적 |
| `preferences.api.ts` | 내 선호도 조회/저장 |
| `recommendations.api.ts` | 개인 추천 |
| `meetings.api.ts` | 모임 생성/조회/참여/추천/확정 |
| `mealHistory.api.ts` | 식사 기록 조회/생성/삭제 |

## 8. Backend 응답과 UI 모델 매핑

현재 `App.tsx`에는 다음 mapper가 있다.

| 함수 | 변환 |
|---|---|
| `mapPickItems` | master data → 선택 UI item |
| `mapMenus` | menu API → menu option |
| `mapMeetingPurposes` | meeting purpose API → select option |
| `mapUsers` | users API → participant option |
| `mapRecommendations` | recommendation API → ranking item |
| `mapMeetings` | meetings API → meeting card/detail model |
| `mapHistories` | meal-history API → history card model |

다음 구현 단계에서는 이 함수들을 `domain/mapper`로 이동한다.

## 9. Loading / Error / Empty 기준

| 상태 | UI 기준 |
|---|---|
| loading | 버튼 disabled, 필요한 경우 skeleton 또는 loading text |
| error | 화면 상단 또는 관련 패널에 메시지 표시 |
| empty | 빈 상태 문구와 다음 액션 제공 |
| success | toast 또는 화면 상태 전환 |

API 에러를 `console.error`만 남기고 끝내지 않는다. 사용자가 다음에 무엇을 해야 하는지 알 수 있어야 한다.

## 10. 개인 추천 상태 계약

```text
추천 조건 입력
-> POST /recommendations/personal
-> recommendationItems 갱신
-> 사용자가 후보 선택
-> 최종 확정
-> POST /meal-history
-> historyItems 갱신
```

규칙:

- 추천 요청 전에는 랭킹을 확정 상태처럼 보이지 않는다.
- 메뉴별 즉시 기록 버튼은 사용하지 않는다.
- 최종 확정 이후에만 식사 기록이 생성된다.

## 11. 모임 추천 상태 계약

```text
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

- 게스트는 추천 결과 확인만 가능하다.
- 메뉴 확정은 모임 생성자만 가능하다.
- 메뉴 확정 후 게스트 계정 정리는 backend가 담당한다.

## 12. Fallback data 기준

master data API가 실패하거나 빈 배열을 반환하면 `frontend/src/data.ts`의 fallback data를 사용할 수 있다.

허용 범위:

- 로컬 개발
- 초기 화면 렌더링
- API 장애 시 최소 UI 유지

금지 범위:

- 실제 추천 결과를 mock ranking으로 성공처럼 표시
- backend 실패를 숨기고 저장/확정이 된 것처럼 표시

## 13. QA 체크리스트

- API base URL이 올바른지 확인한다.
- backend가 꺼졌을 때 JSON 파싱 에러 대신 설정 안내가 나오는지 확인한다.
- 로그인/게스트 시작 후 token 저장 여부를 확인한다.
- 로그아웃 시 token과 session meta가 삭제되는지 확인한다.
- 개인 추천 확정 시 식사 기록이 생성되는지 확인한다.
- 모임 추천에서 제외한 구성원이 `participantUserIds`에서 빠지는지 확인한다.
- 게스트가 메뉴 확정을 시도할 수 없는지 확인한다.
