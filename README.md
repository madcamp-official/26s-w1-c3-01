# MUK PICK

**먹픽(MUK PICK)** 은 개인과 모임의 음식 취향, 알러지 및 제한 조건, 예산 조건, 최근 식사 기록을 바탕으로 식사 메뉴를 추천하는 웹 서비스입니다.

사용자는 혼자 먹을 메뉴를 빠르게 추천받을 수 있고, 모임에서는 여러 참여자의 선호도를 종합해 모두가 수용하기 쉬운 메뉴 후보를 확인할 수 있습니다.

---

## 1. 프로젝트 정보

| 항목    | 내용                                  |
| ----- | ----------------------------------- |
| 과제    | 공통과제 I: 웹 기반 프로젝트                   |
| 프로젝트명 | 먹픽 (MUK PICK)                       |
| 주제    | 메뉴 결정 갈등을 줄여주는 개인/모임 메뉴 추천 서비스      |
| 형태    | React + Express + Supabase 기반 웹 서비스 |

---

## 2. 팀원

| 이름  | GitHub    | 역할         |
| --- | --------- | ---------- |
| 손기환 | Kihwan819 | 공동 기획 및 개발 |
| 박지호 | batiger00 | 공동 기획 및 개발 |

---

## 3. 프로젝트 목적

식사 메뉴를 고르는 과정은 개인에게도, 여러 명이 함께하는 모임에서도 자주 발생하는 의사결정 문제입니다. 특히 모임에서는 각자의 취향, 알러지, 예산, 최근에 먹은 메뉴가 달라 메뉴를 결정하는 데 시간이 오래 걸릴 수 있습니다.

먹픽은 이러한 문제를 줄이기 위해 다음을 목표로 합니다.

* 개인 사용자의 음식 취향과 제한 조건을 반영한 메뉴 추천
* 최근 식사 기록을 고려한 반복 메뉴 감점
* 예산 조건을 반영한 현실적인 메뉴 후보 제공
* 여러 참여자의 선호도를 종합한 모임 메뉴 추천
* 알러지 및 제한 조건과 충돌하는 메뉴 제외
* 추천 점수와 이유를 함께 제공하는 납득 가능한 메뉴 결정 지원

---

## 4. 주요 기능

### 4.1 사용자 인증

* 이메일 회원가입 및 로그인
* Google OAuth 로그인
* OAuth 신규 사용자 닉네임 온보딩
* 닉네임 중복 확인
* access token / refresh token 기반 세션 유지
* 게스트 임시 계정 생성 및 모임 참여

### 4.2 선호도 설정

* 음식 카테고리 선택
* 음식 태그 선택
* 카테고리별 선호 점수 설정
* 태그별 선호 점수 설정
* 알러지 및 제한 조건 선택
* 예산 조건 설정
* 최근 식사 중복 패널티 기간 설정
* 새로운 메뉴 포함 여부 설정

### 4.3 개인 메뉴 추천

* 개인 선호도 기반 메뉴 랭킹 제공
* 알러지 및 제한 조건과 충돌하는 메뉴 제외
* 예산 조건 반영
* 최근에 먹은 메뉴 감점
* 추천 메뉴 점수와 추천 이유 제공
* 추천 메뉴 확정 시 식사 기록으로 저장

### 4.4 모임 메뉴 추천

* 모임 생성 및 모임 ID 기반 참여
* 게스트 모임 preview 및 참여
* 참여자 목록 확인
* 추천 계산에 포함할 참여자 선택
* 참여자별 선호도, 알러지, 예산 조건 종합
* 모임 목적에 맞는 메뉴 추천
* 모임 생성자에 의한 최종 메뉴 확정

### 4.5 식사 기록 및 메뉴 상호작용

* 식사 기록 조회, 생성, 수정, 삭제
* 만족도와 메모 저장
* 메뉴 좋아요, 싫어요, 북마크
* 메뉴별 상호작용 상태 조회 및 토글

---

## 5. 추천 방식 요약

먹픽은 단순 랜덤 추천이 아니라, 사용자 선호도와 메뉴 데이터를 기반으로 점수를 계산해 메뉴를 추천합니다.

### 5.1 개인 추천

개인 추천은 다음 요소를 반영합니다.

* 카테고리 선호도
* 태그 선호도
* 메뉴 선호도 또는 식사 기록 평점
* 예산 조건
* 최근 식사 기록
* 알러지 및 제한 조건

알러지와 충돌하는 메뉴는 추천 후보에서 제외되며, 최근에 먹은 메뉴는 설정된 기간에 따라 감점됩니다.

### 5.2 모임 추천

모임 추천은 다음 요소를 반영합니다.

* 참여자별 카테고리 선호도
* 참여자별 태그 선호도
* 참여자별 메뉴 선호도
* 참여자별 예산 조건
* 참여자별 알러지 및 제한 조건
* 모임 목적 적합도

참여자 중 한 명이라도 알러지와 충돌하거나 강하게 비선호한 메뉴는 추천 후보에서 제외됩니다. 추천 결과는 모임 전체 평균 점수뿐만 아니라 특정 참여자에게 지나치게 불리하지 않은지도 고려합니다.

---

## 6. 기술 스택

### Frontend

| 항목          | 기술           |
| ----------- | ------------ |
| Framework   | React 19     |
| Build Tool  | Vite         |
| Language    | TypeScript   |
| Styling     | CSS          |
| Icon        | lucide-react |
| Auth Client | Supabase JS  |

### Backend

| 항목         | 기술           |
| ---------- | ------------ |
| Runtime    | Node.js      |
| Framework  | Express      |
| Language   | TypeScript   |
| Validation | Zod          |
| Security   | Helmet, CORS |
| Test       | Vitest       |

### Database / Infra

| 항목        | 기술                  |
| --------- | ------------------- |
| Database  | Supabase PostgreSQL |
| Auth      | Supabase Auth       |
| Storage   | Supabase Storage    |
| Migration | Supabase migrations |
| Seed      | `supabase/seed.sql` |

---

## 7. 프로젝트 구조

```text
.
├─ frontend/        # React + Vite 클라이언트
├─ backend/         # Express API 서버
├─ supabase/        # Supabase migration, seed, local config
├─ docs/            # 기능/API/DB/프론트엔드 설계 문서
├─ assets/          # 문서용 이미지
├─ package.json     # 루트 실행 스크립트
└─ README.md
```

### 7.1 Frontend

```text
frontend/src/
├─ App.tsx
├─ app/             # 앱 shell, URL sync, 전역 상태 조립
├─ api/             # backend API wrapper
├─ components/      # 공통 UI 컴포넌트
├─ domain/          # backend 응답 -> UI 모델 변환
├─ features/        # auth, preferences, recommendations, meetings 등 기능 단위 코드
├─ types/
├─ utils/
└─ styles.css
```

### 7.2 Backend

```text
backend/src/
├─ app.ts
├─ server.ts
├─ routes/
├─ modules/
│  ├─ auth/
│  ├─ users/
│  ├─ master-data/
│  ├─ preferences/
│  ├─ user-preferences/
│  ├─ recommendations/
│  ├─ menu-interactions/
│  ├─ meetings/
│  ├─ meeting-recommendations/
│  └─ meal-history/
├─ common/
└─ config/
```

---

## 8. 실행 방법

### 8.1 패키지 설치

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 8.2 Supabase 로컬 실행

Docker Desktop을 실행한 뒤 다음 명령어를 실행합니다.

```bash
npm run supabase:start
npm run supabase:reset
```

`supabase:start` 실행 후 출력되는 local Supabase URL, anon key, service role key를 환경변수에 반영합니다.

### 8.3 Backend 환경변수 설정

```bash
cp backend/.env.example backend/.env
```

`backend/.env` 예시:

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_ANON_KEY="your-local-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-local-supabase-service-role-key"
PUBLIC_SITE_URL="http://localhost:5173"
AUTH_EMAIL_REDIRECT_URL="http://localhost:5173"
```

`SUPABASE_SERVICE_ROLE_KEY`는 backend 전용 환경변수입니다. 프론트엔드에 노출하면 안 됩니다.

### 8.4 Frontend 환경변수 설정

```bash
cp frontend/.env.example frontend/.env
```

`frontend/.env` 예시:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-supabase-anon-key
```

### 8.5 Backend 실행

```bash
npm run backend:dev
```

기본 주소:

```text
http://localhost:3000
```

상태 확인:

```text
http://localhost:3000/health
```

### 8.6 Frontend 실행

```bash
npm run frontend:dev
```

기본 주소:

```text
http://localhost:5173
```

### 8.7 Build / Test

```bash
npm run backend:build
npm run frontend:build
npm run backend:test
```

---

## 9. 주요 API

백엔드 API는 `/api/v1` prefix를 사용합니다.

| 영역               | Endpoint                                          |
| ---------------- | ------------------------------------------------- |
| Auth             | `/api/v1/auth`                                    |
| User             | `/api/v1/users`                                   |
| Menu             | `/api/v1/menus`                                   |
| Preference       | `/api/v1/preferences`, `/api/v1/user-preferences` |
| Recommendation   | `/api/v1/recommendations`                         |
| Menu Interaction | `/api/v1/menu-interactions`                       |
| Meeting          | `/api/v1/meetings`                                |
| Meal History     | `/api/v1/meal-history`                            |

상태 확인 API:

```http
GET /health
```

자세한 API 명세는 [`docs/backend.md`](docs/backend.md)를 참고합니다.

---

## 10. Seed Data

`supabase/seed.sql`은 기본 master data를 제공합니다.

### 10.1 카테고리

```text
한식, 중식, 양식, 일식, 아시안, 고기, 패스트푸드
```

### 10.2 태그

```text
구이, 국물, 조림, 찜, 삶음, 볶음, 튀김, 날것, 매운맛
```

### 10.3 모임 목적

```text
가벼운 식사, 든든한 식사, 회식, 데이트, 팀플 식사, 새로운 메뉴 시도, 건강식
```

### 10.4 기본 메뉴 예시

```text
김치찌개, 비빔밥, 제육볶음, 짜장면, 마라탕, 초밥, 라멘, 파스타, 샐러드볼, 쌀국수
```

---

## 11. 구현 범위

### 11.1 현재 구현된 MVP 범위

* 이메일 회원가입/로그인/로그아웃
* Google OAuth 로그인
* OAuth 신규 사용자 닉네임 온보딩
* 게스트 시작 및 모임 참여
* 선호도 설정
* 예산 조건 설정
* 최근 식사 중복 패널티 설정
* 개인 메뉴 추천
* 개인 추천 메뉴 확정 및 식사 기록 생성
* 식사 기록 조회/수정/삭제
* 메뉴 좋아요/싫어요/북마크
* 모임 생성/조회/수정
* 모임 참여자 관리
* 모임 메뉴 추천
* 모임 메뉴 최종 확정
* Supabase 기반 DB/Auth/Storage 연동
* 모바일 중심 UI

### 11.2 현재 MVP에서 제외한 기능

* 주변 식당 위치 기반 추천
* 실시간 지도/거리 계산
* 배달앱 또는 예약 서비스 연동
* 투표 기반 최종 메뉴 결정
* 반복 모임 그룹 관리
* 머신러닝 기반 추천 모델
* 결제 기능

현재 먹픽은 식당 추천 서비스가 아니라 **메뉴 추천 서비스**에 집중합니다.

---

## 12. 관련 문서

| 문서                                              | 설명                                            |
| ----------------------------------------------- | --------------------------------------------- |
| [기능명세서](docs/기능명세서.md)                          | 서비스 기능 요구사항                                   |
| [DB 스키마](docs/dbschema.md)                      | Supabase DB 테이블, view, RPC, Storage 설계        |
| [백엔드 구조 및 API](docs/backend.md)                 | Express API 구조와 endpoint 설명                   |
| [프론트엔드 아키텍처](docs/frontend-architecture.md)     | React/Vite 프론트 구조                             |
| [프론트엔드 API 및 상태 계약](docs/frontend-api-state.md) | API client, token, URL state, localStorage 계약 |
| [프론트엔드 컴포넌트 설계](docs/frontend-components.md)    | 화면 및 컴포넌트 구조                                  |
| [ERD 이미지](assets/dbschema-erd.png)              | DB 관계도                                        |

---

## 13. 개발 확인 체크리스트

* Supabase local stack 실행 여부
* `supabase db reset`으로 migration/seed 적용 여부
* backend `.env` 설정 여부
* frontend `.env` 설정 여부
* `GET /health` 정상 응답 여부
* 이메일 회원가입/로그인 동작 여부
* Google OAuth 로그인 동작 여부
* 게스트 모임 참여 동작 여부
* 선호도 저장 동작 여부
* 개인 추천 생성 및 확정 동작 여부
* 식사 기록 생성/수정/삭제 동작 여부
* 좋아요/싫어요/북마크 토글 동작 여부
* 모임 생성/추천/확정 동작 여부
* 새로고침 후 주요 화면 상태 복원 여부
