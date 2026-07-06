# MUK PICK 프론트엔드 구현 진행상황 체크리스트

작성 기준일: 2026-07-06  
대상 브랜치: `feat/frontend`  
기준 문서: `docs/frontend-architecture.md`, `docs/frontend-routing.md`, `docs/frontend-components.md`, `docs/frontend-api-state.md`, `docs/기능명세서.md`, `docs/backend.md`

## 상태 기준

- [x] 완료: 문서 기준 기능이 현재 활성 프론트 코드에서 확인됨
- [△] 부분/애매: 일부 구현됐지만 검증, 문서 정합성, 백엔드/외부 설정, UX 완성도가 남음
- [ ] 미완료: 문서 기준 기능이 현재 활성 앱 흐름에 아직 없음

## 1. 프로젝트 기반과 활성 구조

- [x] React + Vite + TypeScript 기반으로 구성되어 있다.
  - 근거: `frontend/src/main.tsx`가 `App`을 렌더링하고, 문서상 기술 스택도 React 19 + Vite로 정의되어 있다.
- [x] 실제 활성 진입점은 `main.tsx -> App.tsx`이다.
  - 기존 `frontend/src/routes/AppRouter.tsx`는 제거되었다.
- [x] 모바일 앱 형태의 단일 화면 shell, 하단 네비게이션, 모바일 고정 폭 UI가 적용되어 있다.
- [x] API wrapper가 `frontend/src/api/*`로 분리되어 있다.
  - `auth`, `users`, `masterData`, `preferences`, `recommendations`, `meetings`, `mealHistory`, `oauth` API 파일이 존재한다.
- [x] API 응답을 화면 표시 모델로 바꾸는 mapper가 `frontend/src/domain/appModel.ts`로 일부 분리되어 있다.
- [△] `App.tsx`가 여전히 인증, 온보딩, 홈, 추천, 모임, 프로필, 토스트, 로딩, 에러 상태를 많이 조립한다.
  - 문서의 목표 구조는 `app/`, `features/`, `components/`, `domain/mapper`로 더 세분화하는 것이다.
- [△] `frontend/src/features/*`에는 기존 route 기반 page 코드가 일부 남아 있지만 현재 활성 UI 기준은 아니다.
  - 활성 진입점은 `App.tsx`이며, 남은 legacy page module은 점진 제거 또는 새 feature view로 이관한다.
- [ ] 목표 구조인 `frontend/src/app/`, `features/home`, `features/profile`, `components/primitives`, `components/navigation`, `domain/mapper` 단위의 완전한 재구성은 아직 완료되지 않았다.

## 2. 라우팅과 화면 이동

- [x] 현재 앱은 `flow`와 `activeTab` 상태로 화면을 전환하고, 주요 상태를 URL과 동기화한다.
- [x] 회원 시작 flow가 단계형으로 구성되어 있다.
  - 닉네임 입력
  - 카테고리 선호 선택
  - 태그 선호 선택
  - 알러지 선택
  - 최근 식사 패널티 설정
  - 완료 화면
- [x] 게스트 시작 flow가 회원 flow와 분리되어 있다.
  - 카테고리 선호 선택
  - 태그 선호 선택
  - 알러지 선택
  - 모임 ID 입력
  - 모임 preview 확인
  - 모임 내 표시 이름 입력
- [x] 메인 하단 탭은 홈, 모임, 프로필 중심으로 구성되어 있다.
- [x] 개인 추천, 선호도 관리, 식사 기록은 하단 탭이 아니라 홈/프로필 내부 액션으로 진입하는 구조다.
- [x] 게스트는 모임 상세 중심으로 제한 접근한다.
- [x] 새로고침 시 access token, refresh token, 게스트 세션 메타데이터, activeTab, 선택 중인 추천 후보를 복원한다.
- [x] 브라우저 뒤로가기/앞으로가기, 공유 가능한 `/meetings/{meetingId}` 상세 URL, 특정 화면 직접 진입을 URL 동기화로 처리한다.
- [x] OAuth/일반 시작 흐름 문서는 최신 모바일 UI 기준으로 갱신되어 있다.

## 3. 인증, 회원가입, 로그아웃

- [x] Google OAuth 시작 버튼과 Supabase SDK `signInWithOAuth()` 호출 코드가 있다.
- [x] OAuth callback URL fragment에서 `access_token`, `refresh_token`, `expires_at`을 읽고 localStorage에 저장하는 코드가 있다.
- [x] 일반 회원가입은 이메일, 비밀번호, 닉네임 입력 form을 사용한다.
- [x] 소셜 로그인 신규 사용자는 이메일/비밀번호를 다시 받지 않고 닉네임만 입력한 뒤 선호도 조사로 이동한다.
- [x] 이메일/비밀번호 로그인 form이 모바일 시작 화면에서 진입 가능하다.
- [x] 로그아웃 버튼이 있고, 로그아웃 시 access token, refresh token, expiresAt, session meta를 삭제한다.
- [x] 게스트 시작 시 `POST /auth/guest`를 호출해 임시 계정을 생성하는 흐름이 있다.
- [x] Google OAuth는 코드상 Supabase authorize URL과 callback session 저장을 처리한다.
  - 실제 성공을 위해 Supabase Auth provider, redirect allowlist, Google Cloud OAuth redirect URI를 배포 URL과 일치시켜야 한다.
- [x] access token 만료 전 `POST /auth/refresh`로 refresh token을 사용해 장기 세션을 복구한다.
- [x] refresh 실패 또는 401 재시도 실패 시 로컬 세션을 삭제하고 다시 로그인하도록 안내한다.
- [x] nickname 중복은 `GET /auth/nickname?nickname=...` 사전 확인 UX와 회원가입 완료 직전 재확인으로 처리한다.

## 4. 온보딩과 선호도 관리

- [x] 회원 온보딩에서 카테고리, 태그, 알러지 선택을 순차적으로 입력한다.
- [x] 회원은 최근 식사 중복 패널티 값을 입력한다.
- [x] 게스트는 식사 기록이 없으므로 최근 식사 중복 패널티 입력을 건너뛴다.
- [x] 선호도 저장 시 `PUT /preferences/me` API payload를 생성한다.
- [x] 선호도 관리 화면도 최초 온보딩과 유사한 단계형 UX로 구성되어 있다.
- [x] 선택한 카테고리와 태그에 점수 조절 UI가 있다.
- [△] 점수 조절 값이 추천 결과에 어떤 강도로 반영되는지는 backend 추천 로직과 함께 검증해야 한다.
- [△] 알러지, 기피, 종교적 제한을 문서상 모두 포함하지만 현재 UI에서는 master data가 제공하는 알러지/제한 항목 중심으로 처리된다.
- [△] 선호도 수정 완료 후 전체 홈/추천 상태가 항상 최신 데이터로 재계산되는지는 추가 QA가 필요하다.

## 5. 홈 화면과 모바일 UI

- [x] 시작 화면, 홈, 추천, 모임, 프로필이 모바일 앱 화면처럼 구성되어 있다.
- [x] 홈 화면에 개인 메뉴 추천과 모임 생성 진입 카드가 있다.
- [x] 홈 화면에서 최근 식사 영역을 표시한다.
- [x] 저장한 선호도 카드와 중복되는 홈 카드 일부는 제거되어 홈 정보량이 줄었다.
- [x] 상단 status bar처럼 보이던 시간/배터리 UI는 제거 대상 반영 흐름에 포함되었다.
- [x] 배경 이미지는 Supabase Storage 또는 asset URL mapping을 통해 관리된다.
- [△] 홈 최근 식사는 실제 식사 기록 API 데이터가 없으면 빈 상태 또는 제한된 표시가 된다.
- [△] Supabase Storage asset URL은 코드에 매핑되어 있지만, bucket 공개 권한과 실제 파일 경로는 운영 설정에 의존한다.
- [△] 현재 UI는 단일 CSS 기반이며 Tailwind/shadcn 같은 컴포넌트 라이브러리 기반 설계는 적용되어 있지 않다.
  - 다만 문서 기준으로는 단일 `styles.css`가 현재 스타일링 기준이다.

## 6. 개인 메뉴 추천

- [x] 개인 추천 화면에서 추천 조건을 입력한 뒤 추천 요청 버튼을 누르는 구조다.
- [x] 추천 결과가 바로 확정되지 않고 랭킹 리스트로 표시된다.
- [x] 추천 메뉴 후보 중 하나를 먼저 선택한 뒤 최종 확정 버튼을 누르는 구조다.
- [x] 최종 확정 후 `POST /meal-history`로 식사 기록을 생성하는 흐름이 있다.
- [x] 메뉴별 즉시 기록 버튼 방식은 제거되고, 최종 선택 중심 흐름으로 조정되었다.
- [x] 추천 결과는 `RecommendationList` 형태로 순위, 메뉴명, 점수, 카테고리, reason을 표시한다.
- [△] 추천 이유는 backend 응답의 `reason` 품질에 의존한다.
  - backend가 구체적 reason을 주지 않으면 기본 문장에 가까운 설명만 표시될 수 있다.
- [△] 기능명세서의 R-02 “새로운 메뉴 제안”은 UI 토글/조건은 있으나, 실제 새 메뉴 판별은 backend 추천 로직 검증이 필요하다.
- [△] 알러지나 제한 조건이 추천 결과에서 완전히 제외되는지는 backend 추천 로직과 seed data를 함께 검증해야 한다.

## 7. 식사 기록

- [x] 개인 추천에서 최종 확정한 메뉴가 식사 기록으로 저장되는 흐름이 있다.
- [x] 식사 기록 조회 화면이 있다.
- [x] 식사 기록 생성 API wrapper가 있다.
- [△] 수동 식사 기록 추가 dialog는 존재하지만, 사용자 흐름의 중심은 추천 결과 확정 저장이다.
- [△] 기능명세서 H-04의 만족도 기록은 rating 입력 구조가 일부 있으나, 이후 추천에 실제로 어떻게 반영되는지 명확한 UX와 검증이 부족하다.
- [△] 식사 기록 삭제/수정 API wrapper 또는 backend 명세는 있으나, 모바일 활성 UI에서 충분히 다듬어진 관리 UX는 아직 부족하다.

## 8. 모임 목록, 생성, 참여

- [x] 모임 목록 화면이 있다.
- [x] 새 모임 생성 dialog가 있다.
- [x] 모임 생성 시 모임 이름, 시간, 장소, 목적, 참여자 선택 값을 입력한다.
- [x] 생성된 모임의 모임 ID를 UI에서 확인하고 복사할 수 있다.
- [x] 완료된 모임은 카드가 흐리게 표시된다.
- [x] 완료된 모임은 진행 중 모임보다 뒤쪽에 배치되는 방향으로 정렬된다.
- [x] 모임 카드를 누르면 모임 상세 화면으로 진입한다.
- [x] 회원과 게스트 모두 모임 ID를 입력해 모임 preview를 볼 수 있다.
- [x] 모임 ID preview 후 displayName을 입력해 참여하는 흐름이 있다.
- [x] displayName은 전체 unique가 아니라 모임 내 중복 제한 기준으로 사용된다.
- [△] 기능명세서 G-05의 모임 정보 수정 기능은 backend 명세에는 있으나, 활성 모바일 UI에서 충분한 수정 화면으로 완성되어 있지는 않다.
- [△] 모임 생성자 권한 표시와 모임장/참여자 구분 UX는 backend 응답과 권한 에러 처리에 의존한다.
- [△] 실시간 참여자 반영은 구현되어 있지 않다.
  - 다른 사용자가 참여해도 현재 화면은 새로고침, 재조회, 재진입이 필요할 수 있다.

## 9. 모임 추천과 메뉴 확정

- [x] 모임 상세 화면에서 참여자 목록을 확인할 수 있다.
- [x] 참여자 이름 chip을 눌러 추천 계산에 포함할지 제외할지 선택할 수 있다.
- [x] 제외된 참여자는 `participantUserIds`에서 빠진 상태로 추천 계산 요청을 보낸다.
- [x] `POST /meetings/{meetingId}/recommendations` API wrapper와 호출 흐름이 있다.
- [x] 모임 추천 결과가 랭킹 리스트로 표시된다.
- [x] 모임 추천도 개인 추천과 동일하게 후보를 선택한 뒤 최종 확정하는 구조다.
- [x] `PATCH /meetings/{meetingId}/selected-menu`로 최종 메뉴 확정 요청을 보낸다.
- [x] 게스트는 모임 추천 결과 확인만 가능하고 확정 CTA는 제한된다.
- [x] 메뉴가 확정된 모임은 완료 상태로 구분되어 흐리게 표시된다.
- [△] 추천 점수와 reason은 backend 추천 결과 품질에 의존한다.
- [△] 메뉴 확정 후 게스트 계정 삭제는 backend 책임으로 명세화되어 있으며, 프론트는 즉시 실시간으로 알 수 없다.
- [△] 모임장이 메뉴를 확정했을 때 게스트 화면이 자동으로 갱신되는 실시간 구독 또는 polling은 아직 없다.
- [△] 추천 계산 결과가 비어 있거나 backend 에러가 날 때의 안내 UX는 더 세밀하게 다듬을 여지가 있다.

## 10. 게스트 사용자 흐름

- [x] 게스트는 회원가입 없이 `POST /auth/guest`로 임시 user를 생성한다.
- [x] 게스트 내부 nickname은 서버가 랜덤 생성하는 기준으로 문서화되어 있다.
- [x] 게스트가 실제 모임에서 보이는 이름은 모임 ID 확인 후 입력하는 displayName이다.
- [x] 게스트는 선호도/알러지 입력 후 바로 모임 ID 입력으로 넘어간다.
- [x] 게스트는 최근 식사 기록이 없으므로 최근 식사 패널티 입력을 받지 않는다.
- [x] 게스트는 모임 목록 탐색보다 본인이 참여한 모임 상세 중심으로 제한된다.
- [x] 게스트는 메뉴 확정을 할 수 없도록 UI에서 제한된다.
- [△] 게스트 계정 삭제 시점과 프론트 세션 정리 타이밍은 backend 처리와 재조회 흐름에 의존한다.
- [△] 게스트가 삭제된 뒤 같은 브라우저 localStorage에 남은 access token을 어떻게 처리할지에 대한 UX는 추가 정리가 필요하다.

## 11. API 연동과 상태 관리

- [x] 모든 주요 API 호출은 `apiRequest`를 거친다.
- [x] `VITE_API_BASE_URL`이 없으면 기본 `/api/v1`을 사용한다.
- [x] Vite 개발 서버 proxy는 `/api`를 backend local server로 전달하는 기준을 가진다.
- [x] 인증 요청은 `Authorization: Bearer {token}` 방식으로 처리한다.
- [x] access token은 `mukpick.accessToken` key로 localStorage에 저장한다.
- [x] 게스트 여부, 모임 ID, displayName은 session meta로 저장한다.
- [x] API가 JSON이 아닌 HTML을 반환할 때 사용자가 API 서버 설정 문제를 알 수 있게 처리하는 방향이 문서화되어 있다.
- [x] master data API 실패 시 fallback data를 사용할 수 있는 구조가 있다.
- [△] `docs/frontend-api-state.md`에는 mapper가 아직 `App.tsx`에 있다고 되어 있어 현재 코드와 일부 다르다.
  - 실제로는 `frontend/src/domain/appModel.ts`로 이동된 mapper가 있다.
- [△] loading, error, empty 상태는 기본적으로 있으나, 모든 dialog와 모든 실패 케이스가 같은 수준으로 정리된 것은 아니다.
- [△] 실제 배포 환경에서는 `VITE_API_BASE_URL`이 backend 배포 방식과 일치해야 한다.
  - frontend만 Vercel에 있고 backend가 다른 도메인이라면 환경변수 설정이 필수다.

## 12. 문서와 현재 코드의 정합성

- [x] 프론트 아키텍처, 라우팅, 컴포넌트 설계, API 상태 계약 문서가 존재한다.
- [x] 기능명세서에 게스트, displayName, 모임 ID 참여, 모임 메뉴 확정, 게스트 삭제 기준이 반영되어 있다.
- [x] 백엔드 문서에 guest 생성, meeting preview, meeting join, participantUserIds 추천 계산, selected-menu 확정 API가 반영되어 있다.
- [x] `frontend-routing.md`의 기존 회원 진입 설명은 최신 OAuth/일반 시작 흐름을 기준으로 갱신되어 있다.
- [△] `frontend-api-state.md`의 mapper 위치 설명은 최신 코드와 일부 다르다.
- [x] 기능명세서의 이메일/비밀번호 회원가입과 현재 모바일 UI의 일반 시작 흐름이 일치한다.
- [ ] README의 배포 URL, backend URL, 팀원 정보 등 빈 항목은 아직 정리되지 않았다.
- [ ] 프론트 화면별 상세 QA 시나리오 문서는 아직 별도 파일로 분리되어 있지 않다.

## 13. 배포와 외부 설정

- [x] 프론트는 Vercel 등 정적 배포 환경에서 열릴 수 있는 React/Vite 구조다.
- [x] frontend-only 배포 시 backend base URL을 환경변수로 지정해야 한다는 기준이 문서화되어 있다.
- [x] Google OAuth는 Google Cloud OAuth client와 Supabase provider 설정, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 배포 환경에 있어야 성공한다.
- [x] Supabase Auth provider 설정과 redirect allowlist는 dashboard 배포 체크리스트로 관리한다.
- [△] frontend와 backend를 한 Vercel 프로젝트의 Services로 같이 배포할지, frontend만 배포하고 backend를 별도 배포할지 최종 배포 전략은 아직 프로젝트 설정에 따라 달라진다.

## 14. 접근성, 사용성, 테스트

- [x] 하단 네비게이션과 주요 버튼은 모바일 터치 UI 기준으로 구성되어 있다.
- [x] 선택형 chip/card에는 선택 상태를 시각적으로 표시한다.
- [x] 모임 구성원 제외 상태는 어둡게 표시한다.
- [△] `aria-label`, `aria-pressed`, focus 이동 같은 접근성 기준은 일부 적용되어 있으나 전체 컴포넌트에 일관되게 완료되었다고 보기 어렵다.
- [△] 모달 열림 후 focus 이동, ESC 닫기, 외부 클릭 닫기 정책은 더 정리해야 한다.
- [△] 내부 리스트 스크롤과 전체 화면 스크롤 충돌은 일부 화면에서 조정되었지만 추가 모바일 QA가 필요하다.
- [ ] Playwright 또는 Vitest 기반의 자동화된 프론트 테스트는 아직 없다.
- [ ] OAuth, 게스트 참여, 모임 확정, 식사 기록 생성까지 이어지는 E2E 테스트는 아직 없다.

## 15. 다음 작업 우선순위

1. `App.tsx` 분리
   - 추천 리스트, confirm bar, 모임 상세, 모임 생성 dialog, 선호도 step을 feature/component 단위로 분리한다.
2. 남은 legacy page module 정리
   - 현재 활성 view와 중복되는 기존 route page module을 제거하거나 새 feature view로 이관한다.
3. 실시간 또는 주기적 재조회 전략 결정
   - 모임 참여자 변경, 메뉴 확정, 게스트 세션 만료를 즉시 반영하려면 Supabase Realtime, polling, focus refetch 중 하나를 선택한다.
4. 문서 업데이트
   - mapper 이동, 최신 배포 방식, QA 시나리오를 기존 문서에 반영한다.
5. 테스트 추가
   - 개인 추천 확정 후 식사 기록 생성
   - 모임 참여자 제외 추천 계산
   - 모임 메뉴 확정 권한 제한
   - 게스트 메뉴 확정 차단
   - JSON이 아닌 API 응답 에러 처리

## 현재 요약

현재 프론트엔드는 “초기 모바일 웹앱으로 실제 API를 호출하며 개인 추천, 모임 추천, 게스트 참여, 메뉴 확정 흐름을 체험할 수 있는 수준”까지 구현되어 있다.

다만 아직 “프론트엔드 개발 구조가 안정적으로 분리된 상태”는 아니다. 가장 큰 남은 작업은 `App.tsx` 비대화 해소, 남은 legacy page module 이관/삭제, 실시간 반영 전략, 자동 테스트 추가다.
