# MUK PICK Supabase Backend

## 구성

- DB schema: `supabase/migrations/20260703080344_mukpick_initial_schema.sql`
- Seed data: `supabase/seed.sql`
- Edge Function API: `supabase/functions/api/index.ts`
- Function import map: `supabase/functions/api/deno.json`

## Supabase 적용 기준

- Supabase Auth를 사용한다.
- `public.users.user_id`는 기존 DB 설계에 맞춰 `BIGINT`로 유지한다.
- Supabase Auth의 `auth.users.id`는 `public.users.auth_user_id`로 연결한다.
- 비밀번호는 Supabase Auth가 관리하므로 `password_hash`는 nullable로 둔다.
- `public` schema의 모든 테이블에 RLS를 활성화했다.
- `api` Edge Function은 회원가입/로그인을 위해 `verify_jwt = false`로 두고, 보호 API는 함수 내부에서 `Authorization: Bearer {accessToken}`을 직접 검증한다.
- 추천 목적 적합도는 `menu_purpose_suitability.suitability_score = 0`이면 후보에서 제외한다.
- 추천 실행 시 사용한 가중치와 필터 설정은 `recommendation_runs.config_json`에 JSONB로 저장한다.

## 로컬 실행

Docker가 필요하다.

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:functions
```

Function URL:

```text
http://127.0.0.1:54321/functions/v1/api
```

API 문서의 `/api/v1` prefix도 지원한다.

```text
POST http://127.0.0.1:54321/functions/v1/api/api/v1/auth/signup
GET  http://127.0.0.1:54321/functions/v1/api/api/v1/users/me
```

짧은 경로도 지원한다.

```text
POST http://127.0.0.1:54321/functions/v1/api/auth/signup
GET  http://127.0.0.1:54321/functions/v1/api/users/me
```

## 구현된 API

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`

### User

- `GET /users/me`
- `PATCH /users/me`

### Master Data

- `GET /menus`
- `GET /menus/{menuId}`
- `GET /menu-categories`
- `GET /tags`
- `GET /category-tags`
- `GET /allergies`
- `GET /meeting-purposes`

### Preference

- `GET /preferences/me`
- `PUT /preferences/me`

### Recommendation

- `POST /recommendations/personal`
- `POST /meetings/{meetingId}/recommendations`
- `GET /meetings/{meetingId}/recommendations/latest`
- `PATCH /meetings/{meetingId}/selected-menu`

추천 API 기본 설정:

```json
{
  "menuPreference": 0.5,
  "categoryPreference": 0.3,
  "tagPreference": 0.2,
  "purposeSuitabilityRule": "exclude_if_score_zero",
  "averageScore": 0.7,
  "minimumScore": 0.3,
  "strongDislikePenalty": 20,
  "strongDislikeScore": -3,
  "recentDuplicateDays": 3,
  "resultLimit": 3
}
```

`recentDuplicateDays`와 `resultLimit`은 요청 body에서 덮어쓸 수 있다. 기존 API 문서와의 호환을 위해 `excludeRecentDays`, `limit`도 받지만 새 이름이 우선된다.

### Meeting

- `POST /meetings`
- `GET /meetings`
- `GET /meetings/{meetingId}`
- `PATCH /meetings/{meetingId}`
- `POST /meetings/{meetingId}/participants`
- `GET /meetings/{meetingId}/participants`
- `PATCH /meetings/{meetingId}/participants/{participantId}`

### Meal History

- `POST /meal-history`
- `GET /meal-history/me`
- `PATCH /meal-history/{historyId}`
- `DELETE /meal-history/{historyId}`

## 검증

```bash
npm run check:functions
```

현재 개발 머신에는 Docker가 없어 `supabase db reset` 기반 DB 검증은 실행하지 못했다. Docker 설치 후 `npm run supabase:reset`으로 migration과 seed 적용을 확인하면 된다.
