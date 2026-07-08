# MUK PICK Backend

## 구성

* API server: `backend/`
* DB schema: `supabase/migrations/`
* Seed data: `supabase/seed.sql`
* Supabase local config: `supabase/config.toml`

## 역할 분리

```text
frontend/ -> backend/ Express API -> Supabase DB/Auth
```

`backend/`는 API 라우팅, 요청 검증, 인증 확인, 비즈니스 로직, 추천 알고리즘 실행, 모임/참여자 관리, 식사 기록 관리, 메뉴 상호작용 저장을 담당한다.

`supabase/`는 DB/Auth/Storage 인프라 관리를 담당한다. API 구현은 Supabase Functions가 아니라 `backend/` Express 서버에 둔다.

## Supabase 적용 기준

* Supabase Auth를 사용한다.
* `public.users.user_id`는 기존 DB 설계에 맞춰 `BIGINT`로 유지한다.
* Supabase Auth의 `auth.users.id`는 `public.users.auth_user_id`로 연결한다.
* 비밀번호는 Supabase Auth가 관리하므로 `password_hash`는 nullable로 둔다.
* `public` schema의 모든 테이블에 RLS를 활성화했다.
* Express 서버는 `Authorization: Bearer {accessToken}`을 받아 Supabase Auth로 토큰을 검증한다.
* 메뉴 이미지 등 UI 자산은 Supabase Storage의 public bucket을 사용할 수 있다.
* 추천 목적 적합도는 `menu_purpose_suitability.suitability_score = 0`이면 후보에서 제외한다.
* 추천 실행 시 사용한 가중치와 필터 설정은 `recommendation_runs.config_json`에 JSONB로 저장한다.
* 개인 추천은 `menu_recommendation_features` view를 기반으로 메뉴, 카테고리, 태그, 알러지, 가격대, 식사 기록, 선호도 정보를 조합해 계산한다.

## 로컬 DB 실행

Docker가 필요하다.

```bash
npm run supabase:start
npm run supabase:reset
```

## 백엔드 실행

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Health Check

* `GET /health`

응답 예시:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "features": {
      "personalRecommendationFeedback": true,
      "menuInteractions": true,
      "userPreferences": true
    }
  }
}
```

`features`는 현재 백엔드에서 활성화된 주요 기능 플래그를 나타낸다.

## API Prefix

백엔드의 주요 API는 `/api/v1` prefix 아래에서 제공한다.

```text
/health
/api/v1/auth
/api/v1/users
/api/v1/menus
/api/v1/menu-categories
/api/v1/tags
/api/v1/category-tags
/api/v1/allergies
/api/v1/meeting-purposes
/api/v1/preferences
/api/v1/recommendations
/api/v1/menu-interactions
/api/v1/user-preferences
/api/v1/user-category-preferences
/api/v1/meetings
/api/v1/meal-history
```

## API 모듈 기준

### Auth

* `POST /auth/signup`
* `POST /auth/signup/resend`
* `POST /auth/login`
* `POST /auth/refresh`
* `POST /auth/profile`
* `GET /auth/nickname?nickname={nickname}`
* `POST /auth/guest`
* `POST /auth/logout`

`POST /auth/signup`은 이메일, 비밀번호, 닉네임 기반 회원가입에 사용한다.

`POST /auth/signup/resend`는 회원가입 인증 이메일 재전송에 사용한다.

`POST /auth/login`은 이메일/비밀번호 로그인을 수행하고 access token, refresh token, 만료 정보를 반환한다.

`POST /auth/refresh`는 Supabase refresh token으로 새 access token을 발급한다. 실패하면 프론트는 저장된 access token, refresh token, 만료 시각, 세션 메타데이터를 삭제하고 다시 로그인하도록 안내한다.

`POST /auth/profile`은 Supabase OAuth 로그인 이후 `public.users` 프로필을 동기화하는 데 사용한다. Google OAuth 신규 사용자는 프론트 온보딩에서 닉네임을 입력한 뒤 프로필을 동기화한다.

`GET /auth/nickname`은 회원가입 또는 OAuth 온보딩 중 닉네임 중복 확인에 사용한다. 회원가입 완료 직전에도 같은 검사를 다시 수행한다.

`POST /auth/guest`는 이메일/비밀번호 입력 없이 내부용 게스트 계정을 생성한다. 게스트의 `nickname`은 `guest-{random}` 형식으로 서버에서 만들며, 실제 모임 화면에 보이는 이름은 모임 참여 시 입력하는 `displayName`을 사용한다.

`POST /auth/logout`은 인증된 사용자만 호출할 수 있다.

### User

* `GET /users/me`
* `GET /users`
* `PATCH /users/me`

`GET /users/me`는 현재 로그인한 사용자 정보를 조회한다.

`GET /users`는 사용자 검색에 사용한다.

`PATCH /users/me`는 내 사용자 정보를 수정한다.

### Master Data

* `GET /menus`
* `POST /menus`
* `GET /menus/{menuId}`
* `PATCH /menus/{menuId}`
* `DELETE /menus/{menuId}`
* `GET /menu-categories`
* `GET /tags`
* `GET /category-tags`
* `GET /allergies`
* `GET /meeting-purposes`

Master Data 조회 API는 온보딩 전에도 필요하므로 공개한다.

메뉴 등록, 수정, 삭제는 인증이 필요하다. 별도 관리자 테이블이 없기 때문에 현재 구현에서는 `GROUP_HOST` 사용자에게만 허용하는 방식으로 처리한다.

`GET /menus` query:

```text
categoryId
tagId
keyword
limit
offset
```

### Preference

* `GET /preferences/me`
* `PUT /preferences/me`

기존 선호도 전체 조회/저장 API이다.

온보딩 또는 마이페이지에서 입력한 카테고리, 태그, 알러지, 메뉴 선호 정보를 기존 데이터와 교체하는 방식으로 저장한다.

### User Preference

* `GET /user-preferences`
* `PUT /user-preferences`
* `GET /user-category-preferences`
* `PUT /user-category-preferences`

`/user-preferences`는 사용자 단위의 예산 조건을 관리한다.

지원 필드:

```json
{
  "budgetMin": 1,
  "budgetMax": 5
}
```

snake_case도 호환한다.

```json
{
  "budget_min": 1,
  "budget_max": 5
}
```

`budgetMin`과 `budgetMax`는 null을 허용한다. 둘 다 존재하는 경우 `budgetMin <= budgetMax` 조건을 만족해야 한다.

`/user-category-preferences`는 카테고리명 기반 선호도 저장에 사용한다.

요청 예시:

```json
{
  "preferences": [
    {
      "category": "한식",
      "preferenceScore": 5
    },
    {
      "category": "중식",
      "preferenceScore": 3
    }
  ]
}
```

카테고리 선호도 점수 범위는 `0~5`이다. `0`은 추천 후보 제외 조건으로 사용될 수 있다.

### Menu Interaction

* `GET /menu-interactions/me`
* `POST /menu-interactions`
* `PUT /menu-interactions/{menuId}`

메뉴 상호작용은 사용자의 메뉴별 행동 기록과 좋아요/싫어요/북마크 상태 저장에 사용한다.

`POST /menu-interactions`는 메뉴 행동을 기록한다.

지원 interaction type:

```text
view
like
pick
dislike
bookmark
```

요청 예시:

```json
{
  "menuId": 1,
  "interactionType": "view"
}
```

snake_case도 호환한다.

```json
{
  "menu_id": 1,
  "interaction_type": "view"
}
```

`PUT /menu-interactions/{menuId}`는 토글형 상태를 설정한다.

지원 interaction type:

```text
like
dislike
bookmark
```

요청 예시:

```json
{
  "interactionType": "bookmark",
  "selected": true
}
```

`GET /menu-interactions/me`는 현재 사용자의 메뉴별 상호작용 상태를 조회한다.

### Personal Recommendation

* `GET /recommendations/personal`
* `POST /recommendations/personal`

개인 추천은 로그인한 사용자의 선호도, 식사 기록, 알러지, 예산 조건, 메뉴 feature를 기반으로 추천 결과를 계산한다.

`GET /recommendations/personal`은 query string 기반으로 개인 추천을 조회한다.

지원 query:

```text
meetingPurposeId
limit
```

`POST /recommendations/personal`은 body 기반으로 개인 추천을 생성한다.

지원 body:

```json
{
  "meetingPurposeId": 1,
  "excludeRecentDays": 7,
  "recentDuplicateDays": 7,
  "includeNewMenu": true,
  "budgetMin": 1,
  "budgetMax": 4,
  "limit": 5
}
```

개인 추천 기본 `limit`은 `5`이다. `limit`은 `1~50` 범위에서 지정할 수 있다.

`recentDuplicateDays`가 있으면 해당 값을 최근 식사 중복 패널티 기간으로 사용한다. 없으면 `excludeRecentDays`를 사용하고, 둘 다 없으면 최근 식사 패널티를 적용하지 않는다.

`includeNewMenu`가 `false`이면 식사 기록이 없는 새로운 메뉴는 후보에서 제외한다.

알러지 충돌이 있는 메뉴는 후보에서 제외한다.

#### 개인 추천 점수식

개인 추천 알고리즘 버전:

```text
personal-simple-v2
```

총점은 최대 100점이며, 아래 요소를 합산한 뒤 최근 식사 패널티를 차감한다.

```text
totalScore = categoryScore + tagScore + menuPreferenceScore + budgetScore - historyPenalty
```

최종 점수는 `0~100` 범위로 clamp한다.

세부 점수:

| 항목        |    최대 점수 | 계산 기준                               |
| --------- | -------: | ----------------------------------- |
| 카테고리 선호도  |       35 | 사용자 카테고리 선호도 `0~5`를 35점으로 환산        |
| 태그 선호도    |       25 | 메뉴 태그들의 사용자 선호도 평균 `0~5`를 25점으로 환산  |
| 메뉴 선호도    |       25 | 명시적 메뉴 선호도 또는 식사 기록 평점 평균을 25점으로 환산 |
| 예산 적합도    |       15 | 가격대가 예산 범위에 맞으면 15점                 |
| 최근 식사 패널티 | 최대 35 차감 | 최근 먹은 메뉴일수록 강하게 감점                  |

예산 점수 기준:

| 조건                       | 점수 |
| ------------------------ | -: |
| 메뉴 가격대가 없거나 예산 상한이 없는 경우 | 15 |
| 메뉴 가격대가 예산 상한보다 높은 경우    |  8 |
| 메뉴 가격대가 예산 하한보다 낮은 경우    | 12 |
| 메뉴 가격대가 예산 범위 안에 있는 경우   | 15 |

최근 식사 패널티 기준:

```text
historyPenalty = 35 * (1 - daysSinceLastEaten / recentDuplicateDays)
```

최근 식사 기록이 없거나 `recentDuplicateDays <= 0`이면 패널티는 0이다.

동점 정렬 기준:

1. 총점 높은 순
2. 최근 식사 패널티 낮은 순
3. 메뉴 선호도 점수 높은 순
4. 카테고리 점수 높은 순
5. 태그 점수 높은 순
6. 예산 점수 높은 순
7. 메뉴명 가나다순
8. menuId 오름차순

### Meeting Recommendation

* `POST /meetings/{meetingId}/recommendations`
* `GET /meetings/{meetingId}/recommendations/latest`
* `PATCH /meetings/{meetingId}/selected-menu`

모임 추천은 참여자들의 선호도와 모임 목적 적합도를 함께 반영한다.

요청 예시:

```json
{
  "resultLimit": 3,
  "participantUserIds": [1, 2, 5],
  "budgetMin": 1,
  "budgetMax": 4
}
```

기존 API 문서와의 호환을 위해 `limit`도 받지만, 새 이름인 `resultLimit`이 우선된다.

기본 설정:

```json
{
  "resultLimit": 3
}
```

`resultLimit`은 `1~10` 범위에서 지정할 수 있다.

`participantUserIds`를 전달하면 특정 구성원만 포함해 추천을 계산할 수 있다.

모임 추천 후보 제외 조건:

* 참여자 중 한 명이라도 알러지 충돌이 있는 메뉴
* 참여자 중 한 명이라도 해당 카테고리 선호도를 명시적으로 `0`으로 설정한 메뉴
* 참여자 중 한 명이라도 해당 메뉴 선호도를 명시적으로 `0`으로 설정한 메뉴
* 모임 목적 적합도 점수가 `0`인 메뉴

#### 모임 추천 점수식

모임 추천 총점은 최대 100점이다.

```text
totalScore = groupPreferenceScore + purposeScore
```

참여자별 선호 점수는 아래 4개 항목으로 계산한다.

| 항목       | 최대 점수 |
| -------- | ----: |
| 카테고리 선호도 |    30 |
| 태그 선호도   |    20 |
| 메뉴 선호도   |    25 |
| 예산 적합도   |    10 |

참여자별 원점수 최대값은 85점이다. 이를 80점 만점으로 환산한다.

```text
participantScore = (categoryScore + tagScore + menuPreferenceScore + budgetScore) / 85 * 80
```

모든 참여자의 `participantScore` 평균이 `groupPreferenceScore`가 된다.

모임 목적 적합도는 `0~5` 점수를 20점 만점으로 환산한다.

```text
purposeScore = purposeSuitability / 5 * 20
```

최종 점수는 `0~100` 범위로 clamp한다.

모임 추천 정렬 기준:

1. 총점 높은 순
2. 최소 참여자 점수 높은 순
3. 모임 목적 점수 높은 순
4. 그룹 평균 선호 점수 높은 순
5. 메뉴명 가나다순
6. menuId 오름차순

`GET /meetings/{meetingId}/recommendations/latest`는 해당 모임의 최신 추천 결과를 조회한다.

`PATCH /meetings/{meetingId}/selected-menu`는 모임 생성자만 호출할 수 있다. 게스트가 호출하면 `403`을 반환한다. 메뉴 확정이 성공하면 해당 모임에 참여한 게스트 계정은 Supabase Auth와 `users`에서 정리된다.

요청 예시:

```json
{
  "menuId": 1
}
```

### Meeting

* `POST /meetings`
* `GET /meetings`
* `GET /meetings/{meetingId}/preview`
* `GET /meetings/{meetingId}`
* `PATCH /meetings/{meetingId}`
* `POST /meetings/{meetingId}/join`
* `POST /meetings/{meetingId}/participants`
* `GET /meetings/{meetingId}/participants`

`POST /meetings`는 인증된 사용자가 모임을 생성할 때 사용한다. 생성자는 모임 host가 된다.

`GET /meetings`는 내가 참여한 모임 목록을 조회한다.

`GET /meetings/{meetingId}/preview`는 아직 참여하지 않은 사용자도 모임 ID 입력 후 모임 정보와 기존 구성원 표시 이름을 확인할 수 있게 한다.

`GET /meetings/{meetingId}`는 인증된 사용자가 모임 상세 정보를 조회할 때 사용한다.

`PATCH /meetings/{meetingId}`는 모임 정보를 수정한다.

`POST /meetings/{meetingId}/join`은 body의 `displayName`으로 모임에 참여한다. `displayName`은 전체 DB에서 unique일 필요는 없지만, 같은 모임 안에서는 중복될 수 없다.

`POST /meetings/{meetingId}/participants`는 모임 참여자를 추가한다.

`GET /meetings/{meetingId}/participants`는 모임 참여자 목록을 조회한다.

### Meal History

* `POST /meal-history`
* `GET /meal-history/me`
* `GET /meal-history/{historyId}`
* `PATCH /meal-history/{historyId}`
* `DELETE /meal-history/{historyId}`

식사 기록은 개인 추천의 메뉴 선호도 보정과 최근 식사 중복 패널티 계산에 사용한다.

`POST /meal-history`는 식사 기록을 생성한다.

`GET /meal-history/me`는 현재 사용자의 식사 기록 목록을 조회한다.

`GET /meal-history/{historyId}`는 특정 식사 기록을 조회한다.

`PATCH /meal-history/{historyId}`는 식사 기록을 수정한다.

`DELETE /meal-history/{historyId}`는 식사 기록을 삭제한다.

## 검증

```bash
npm run backend:build
npm run backend:test
```

Docker 설치 후 `npm run supabase:reset`으로 migration과 seed 적용을 확인한다.