# 메뉴 결정 앱 DB 스키마 설계 개정안

## ERD 이미지

![MUK PICK DB ERD](../assets/dbschema-erd.png)

## 1. 개요

본 프로젝트는 사용자의 음식 선호도, 알러지 및 제한 조건, 최근 식사 기록, 예산 조건, 약속 목적, 모임 참여자 정보를 기반으로 메뉴를 추천하는 앱이다.

추천 시스템은 문자열 검색 중심이 아니라 정형화된 사용자 데이터와 메뉴 feature를 활용한 `content-based weighted ranking` 방식을 기준으로 설계한다.

백엔드는 Supabase PostgreSQL을 데이터베이스로 사용하고, Supabase Auth를 인증 계층으로 사용한다. 앱의 주요 API 로직은 Supabase Functions가 아니라 `backend/` Express 서버에서 처리한다.

---

## 2. 전체 구성

### 2.1 데이터베이스 관리 위치

* DB migration: `supabase/migrations/`
* Seed data: `supabase/seed.sql`
* Supabase local config: `supabase/config.toml`
* API server: `backend/`

### 2.2 Supabase 적용 기준

* `auth.users.id`는 `public.users.auth_user_id`와 연결한다.
* `public.users.user_id`는 기존 DB 설계와 백엔드 구현에 맞춰 `BIGINT`를 사용한다.
* 비밀번호는 Supabase Auth가 관리하므로 앱 DB의 `password_hash`는 nullable로 둔다.
* `public` schema의 테이블은 RLS를 활성화한다.
* 백엔드 서버는 Supabase service role client를 사용해 필요한 DB 작업을 수행한다.
* 프론트엔드는 백엔드 API를 통해 데이터를 사용하고, 직접 DB 테이블을 수정하지 않는다.
* 메뉴 이미지 등 UI 자산은 Supabase Storage의 public bucket을 사용할 수 있다.

---

## 3. 테이블 목록

| 테이블명                              | 설명                              |
| --------------------------------- | ------------------------------- |
| `users`                           | 사용자 기본 정보 및 Supabase Auth 연동 정보 |
| `user_preferences`                | 사용자 단위 예산 조건 등 전역 선호 설정         |
| `menus`                           | 추천 대상 메뉴 정보                     |
| `menu_categories`                 | 메뉴 카테고리 정보                      |
| `tags`                            | 메뉴 특성 태그 정보                     |
| `category_tags`                   | 카테고리와 태그의 다대다 관계                |
| `menu_tags`                       | 메뉴와 태그의 다대다 관계                  |
| `user_menu_preferences`           | 사용자별 메뉴 선호도                     |
| `user_category_preferences`       | 사용자별 카테고리 선호도                   |
| `user_tag_preferences`            | 사용자별 태그 선호도                     |
| `user_menu_interactions`          | 사용자 메뉴 행동 기록 및 좋아요/싫어요/북마크 상태   |
| `allergies`                       | 알러지 또는 식단 제한 조건 종류              |
| `user_allergies`                  | 사용자별 알러지 및 제한 조건                |
| `menu_allergies`                  | 메뉴에 포함된 알러지 유발 성분 또는 제한 조건      |
| `meeting_purposes`                | 약속/식사 목적 정보                     |
| `menu_purpose_suitability`        | 메뉴별 약속 목적 적합도                   |
| `meal_history`                    | 사용자 식사 기록                       |
| `meetings`                        | 메뉴 추천이 필요한 약속 정보                |
| `meeting_participants`            | 약속 참여자 정보                       |
| `recommendation_runs`             | 모임 추천 실행 로그                     |
| `meeting_recommendations`         | 모임 추천 실행별 메뉴 추천 결과              |
| `personal_recommendation_runs`    | 개인 추천 실행 로그                     |
| `personal_recommendation_results` | 개인 추천 실행별 메뉴 추천 결과              |

---

## 4. View 및 RPC 목록

| 이름                             | 종류           | 설명                               |
| ------------------------------ | ------------ | -------------------------------- |
| `menu_recommendation_features` | VIEW         | 추천 알고리즘에서 사용할 메뉴 feature 통합 view |
| `set_menu_interaction_state`   | RPC Function | 좋아요/싫어요/북마크 토글 상태를 원자적으로 설정      |

---

## 5. Storage Bucket

| Bucket      | Public | File size limit | 설명                                    |
| ----------- | ------ | --------------: | ------------------------------------- |
| `ui-assets` | true   |            10MB | 프론트 UI 이미지, 메뉴 이미지, 배경 이미지 등 정적 자산 저장 |

`ui-assets`는 public bucket으로 사용한다. 프론트에서 직접 접근 가능한 이미지 URL을 만들기 위한 용도이며, 인증이 필요한 사용자 데이터 저장소로 사용하지 않는다.

---

## 6. 테이블 상세 설계

### 6.1 `users`

사용자 기본 정보와 Supabase Auth 연동 정보를 저장하는 테이블이다.

| Attribute       | Type           | Key        | Null     | 설명                                       |
| --------------- | -------------- | ---------- | -------- | ---------------------------------------- |
| `user_id`       | `BIGINT`       | PK         | NOT NULL | 사용자 고유 ID                                |
| `auth_user_id`  | `UUID`         | UNIQUE, FK | NOT NULL | Supabase Auth 사용자 ID                     |
| `email`         | `VARCHAR(100)` | UNIQUE     | NOT NULL | 로그인 이메일                                  |
| `password_hash` | `VARCHAR(255)` |            | NULL     | Supabase Auth 사용 시 앱 DB에는 저장하지 않음        |
| `nickname`      | `VARCHAR(50)`  | UNIQUE     | NOT NULL | 사용자 닉네임                                  |
| `user_type`     | `VARCHAR(20)`  |            | NULL     | 사용자 유형. 예: `USER`, `GUEST`, `GROUP_HOST` |
| `created_at`    | `TIMESTAMPTZ`  |            | NOT NULL | 가입 일시                                    |
| `updated_at`    | `TIMESTAMPTZ`  |            | NOT NULL | 사용자 정보 수정 일시                             |

비고:

* Supabase Auth의 `auth.users.id`를 `auth_user_id`에 저장한다.
* 게스트 시작 시 서버가 `guest-{random}` 형식의 내부 닉네임을 생성한다.
* 게스트가 모임에서 입력하는 이름은 `users.nickname`이 아니라 `meeting_participants.display_name`에 저장한다.
* 로그인 상태 자체는 DB의 `is_logged_in` 같은 컬럼으로 관리하지 않고, Supabase 세션/JWT 토큰으로 관리한다.

---

### 6.2 `user_preferences`

사용자 단위의 전역 선호 설정을 저장하는 테이블이다. 현재 구현에서는 예산 조건을 저장한다.

| Attribute    | Type          | Key    | Null     | 설명       |
| ------------ | ------------- | ------ | -------- | -------- |
| `user_id`    | `BIGINT`      | PK, FK | NOT NULL | 사용자 ID   |
| `budget_min` | `INT`         |        | NULL     | 선호 예산 하한 |
| `budget_max` | `INT`         |        | NULL     | 선호 예산 상한 |
| `updated_at` | `TIMESTAMPTZ` |        | NOT NULL | 설정 갱신 일시 |

관계:

* `user_preferences.user_id` → `users.user_id`

제약:

* `budget_min`과 `budget_max`는 null을 허용한다.
* 둘 다 존재하는 경우 `budget_min <= budget_max`를 만족해야 한다.
* 추천 알고리즘에서는 요청 body의 예산 조건이 있으면 요청 값을 우선 사용하고, 없으면 `user_preferences`의 값을 사용한다.

예산 레벨 기준:

|  값 | 의미    |
| -: | ----- |
|  1 | 매우 저렴 |
|  2 | 저렴    |
|  3 | 보통    |
|  4 | 비싼 편  |
|  5 | 고가    |

---

### 6.3 `menu_categories`

메뉴의 대분류를 저장하는 테이블이다.

| Attribute     | Type          | Key    | Null     | 설명         |
| ------------- | ------------- | ------ | -------- | ---------- |
| `category_id` | `BIGINT`      | PK     | NOT NULL | 카테고리 고유 ID |
| `name`        | `VARCHAR(50)` | UNIQUE | NOT NULL | 카테고리 이름    |

기본 마스터 목록:

```text
한식
중식
양식
일식
아시안
고기
패스트푸드
```

---

### 6.4 `menus`

추천 대상이 되는 메뉴 정보를 저장하는 테이블이다.

| Attribute     | Type           | Key    | Null     | 설명          |
| ------------- | -------------- | ------ | -------- | ----------- |
| `menu_id`     | `BIGINT`       | PK     | NOT NULL | 메뉴 고유 ID    |
| `category_id` | `BIGINT`       | FK     | NOT NULL | 메뉴 카테고리 ID  |
| `name`        | `VARCHAR(100)` | UNIQUE | NOT NULL | 메뉴 이름       |
| `description` | `TEXT`         |        | NULL     | 메뉴 설명       |
| `spicy_level` | `INT`          |        | NOT NULL | 매운맛 정도. 0~5 |
| `price_level` | `INT`          |        | NULL     | 가격대. 1~5    |
| `calorie`     | `INT`          |        | NULL     | 칼로리         |

관계:

* `menus.category_id` → `menu_categories.category_id`

비고:

* `name`은 seed 및 메뉴 등록 시 중복 방지 기준으로 사용한다.
* 메뉴 이미지는 현재 핵심 테이블 컬럼이 아니라 Storage 자산 또는 프론트 자산으로 관리할 수 있다.

---

### 6.5 `tags`

메뉴의 특성을 표현하는 태그를 저장하는 테이블이다.

| Attribute | Type          | Key    | Null     | 설명       |
| --------- | ------------- | ------ | -------- | -------- |
| `tag_id`  | `BIGINT`      | PK     | NOT NULL | 태그 고유 ID |
| `name`    | `VARCHAR(50)` | UNIQUE | NOT NULL | 태그 이름    |

기본 마스터 목록:

```text
구이
국물
조림
찜
삶음
볶음
튀김
날것
매운맛
```

---

### 6.6 `category_tags`

카테고리에서 선택 가능한 조리 방식 태그를 다대다 관계로 저장하는 테이블이다.

| Attribute     | Type     | Key    | Null     | 설명      |
| ------------- | -------- | ------ | -------- | ------- |
| `category_id` | `BIGINT` | PK, FK | NOT NULL | 카테고리 ID |
| `tag_id`      | `BIGINT` | PK, FK | NOT NULL | 태그 ID   |

복합 기본키:

```text
(category_id, tag_id)
```

관계:

* `category_tags.category_id` → `menu_categories.category_id`
* `category_tags.tag_id` → `tags.tag_id`

활용 예시:

* 한식 카테고리 선택 시 구이, 국물, 조림, 찜, 삶음, 볶음, 튀김, 날것, 매운맛 태그를 선택지로 제공한다.
* 패스트푸드 카테고리 선택 시 구이, 볶음, 튀김, 매운맛 태그를 선택지로 제공한다.

---

### 6.7 `menu_tags`

메뉴와 태그의 다대다 관계를 저장하는 테이블이다.

| Attribute | Type     | Key    | Null     | 설명    |
| --------- | -------- | ------ | -------- | ----- |
| `menu_id` | `BIGINT` | PK, FK | NOT NULL | 메뉴 ID |
| `tag_id`  | `BIGINT` | PK, FK | NOT NULL | 태그 ID |

복합 기본키:

```text
(menu_id, tag_id)
```

관계:

* `menu_tags.menu_id` → `menus.menu_id`
* `menu_tags.tag_id` → `tags.tag_id`

---

### 6.8 `user_menu_preferences`

사용자가 특정 메뉴를 얼마나 선호하는지 저장하는 테이블이다.

| Attribute          | Type          | Key    | Null     | 설명             |
| ------------------ | ------------- | ------ | -------- | -------------- |
| `user_id`          | `BIGINT`      | PK, FK | NOT NULL | 사용자 ID         |
| `menu_id`          | `BIGINT`      | PK, FK | NOT NULL | 메뉴 ID          |
| `preference_score` | `INT`         |        | NOT NULL | 메뉴 선호도 점수. 0~5 |
| `updated_at`       | `TIMESTAMPTZ` |        | NOT NULL | 선호도 갱신 일시      |

복합 기본키:

```text
(user_id, menu_id)
```

관계:

* `user_menu_preferences.user_id` → `users.user_id`
* `user_menu_preferences.menu_id` → `menus.menu_id`

점수 기준:

| 점수 | 의미       |
| -: | -------- |
|  5 | 매우 선호    |
|  4 | 선호       |
|  3 | 보통       |
|  2 | 낮은 선호    |
|  1 | 매우 낮은 선호 |
|  0 | 명시적 비선호  |

비고:

* 모임 추천에서는 참여자 중 한 명이라도 특정 메뉴를 `0`점으로 저장한 경우 해당 메뉴를 후보에서 제외한다.
* 개인 추천에서는 명시적 메뉴 선호도 또는 식사 기록 평점 평균을 메뉴 선호 점수 계산에 사용한다.

---

### 6.9 `user_category_preferences`

사용자가 특정 음식 카테고리를 얼마나 선호하는지 저장하는 테이블이다.

| Attribute          | Type          | Key    | Null     | 설명               |
| ------------------ | ------------- | ------ | -------- | ---------------- |
| `user_id`          | `BIGINT`      | PK, FK | NOT NULL | 사용자 ID           |
| `category_id`      | `BIGINT`      | PK, FK | NOT NULL | 카테고리 ID          |
| `preference_score` | `INT`         |        | NOT NULL | 카테고리 선호도 점수. 0~5 |
| `updated_at`       | `TIMESTAMPTZ` |        | NOT NULL | 선호도 갱신 일시        |

복합 기본키:

```text
(user_id, category_id)
```

관계:

* `user_category_preferences.user_id` → `users.user_id`
* `user_category_preferences.category_id` → `menu_categories.category_id`

비고:

* 카테고리 선호도 점수 범위는 `0~5`이다.
* 모임 추천에서는 참여자 중 한 명이라도 특정 카테고리를 `0`점으로 저장한 경우 해당 카테고리의 메뉴를 후보에서 제외한다.

---

### 6.10 `user_tag_preferences`

사용자가 특정 음식 특성을 얼마나 선호하는지 저장하는 테이블이다.

| Attribute          | Type          | Key    | Null     | 설명             |
| ------------------ | ------------- | ------ | -------- | -------------- |
| `user_id`          | `BIGINT`      | PK, FK | NOT NULL | 사용자 ID         |
| `tag_id`           | `BIGINT`      | PK, FK | NOT NULL | 태그 ID          |
| `preference_score` | `INT`         |        | NOT NULL | 태그 선호도 점수. 0~5 |
| `updated_at`       | `TIMESTAMPTZ` |        | NOT NULL | 선호도 갱신 일시      |

복합 기본키:

```text
(user_id, tag_id)
```

관계:

* `user_tag_preferences.user_id` → `users.user_id`
* `user_tag_preferences.tag_id` → `tags.tag_id`

---

### 6.11 `user_menu_interactions`

사용자의 메뉴별 행동 기록을 저장하는 테이블이다. 조회, 좋아요, 싫어요, 선택, 북마크 등의 행동을 기록하고, 토글형 상호작용 상태 계산에 사용한다.

| Attribute          | Type          | Key | Null     | 설명         |
| ------------------ | ------------- | --- | -------- | ---------- |
| `interaction_id`   | `BIGINT`      | PK  | NOT NULL | 상호작용 고유 ID |
| `user_id`          | `BIGINT`      | FK  | NOT NULL | 사용자 ID     |
| `menu_id`          | `BIGINT`      | FK  | NOT NULL | 메뉴 ID      |
| `interaction_type` | `VARCHAR(20)` |     | NOT NULL | 행동 유형      |
| `created_at`       | `TIMESTAMPTZ` |     | NOT NULL | 행동 생성 일시   |

관계:

* `user_menu_interactions.user_id` → `users.user_id`
* `user_menu_interactions.menu_id` → `menus.menu_id`

지원 interaction type:

```text
view
like
pick
dislike
bookmark
```

토글형 interaction type:

```text
like
dislike
bookmark
```

활용 방식:

* `view`: 메뉴 상세 조회 또는 추천 결과 확인 기록
* `pick`: 메뉴 선택 기록
* `like`: 좋아요 상태 기록
* `dislike`: 싫어요 상태 기록
* `bookmark`: 북마크 상태 기록

비고:

* `POST /menu-interactions`는 행동 로그를 누적 저장한다.
* `PUT /menu-interactions/{menuId}`는 `set_menu_interaction_state` RPC를 통해 좋아요/싫어요/북마크 상태를 설정한다.
* 좋아요와 싫어요는 동시에 활성화되지 않도록 RPC에서 정리한다.
* 북마크는 좋아요/싫어요와 별개로 유지될 수 있다.

---

### 6.12 `allergies`

알러지 또는 식단 제한 조건 종류를 저장하는 테이블이다.

| Attribute    | Type          | Key    | Null     | 설명              |
| ------------ | ------------- | ------ | -------- | --------------- |
| `allergy_id` | `BIGINT`      | PK     | NOT NULL | 알러지 또는 제한 조건 ID |
| `name`       | `VARCHAR(50)` | UNIQUE | NOT NULL | 알러지 또는 제한 조건 이름 |

기본 마스터 목록:

```text
알류
우유
메밀
땅콩
대두
밀
잣
호두
게
새우
오징어
고등어
조개류
복숭아
토마토
닭고기
돼지고기
쇠고기
아황산류
```

---

### 6.13 `user_allergies`

사용자가 가진 알러지 또는 제한 조건을 저장하는 테이블이다.

| Attribute    | Type     | Key    | Null     | 설명              |
| ------------ | -------- | ------ | -------- | --------------- |
| `user_id`    | `BIGINT` | PK, FK | NOT NULL | 사용자 ID          |
| `allergy_id` | `BIGINT` | PK, FK | NOT NULL | 알러지 또는 제한 조건 ID |

복합 기본키:

```text
(user_id, allergy_id)
```

관계:

* `user_allergies.user_id` → `users.user_id`
* `user_allergies.allergy_id` → `allergies.allergy_id`

---

### 6.14 `menu_allergies`

메뉴에 포함된 알러지 유발 성분 또는 제한 조건을 저장하는 테이블이다.

| Attribute    | Type     | Key    | Null     | 설명              |
| ------------ | -------- | ------ | -------- | --------------- |
| `menu_id`    | `BIGINT` | PK, FK | NOT NULL | 메뉴 ID           |
| `allergy_id` | `BIGINT` | PK, FK | NOT NULL | 알러지 또는 제한 조건 ID |

복합 기본키:

```text
(menu_id, allergy_id)
```

관계:

* `menu_allergies.menu_id` → `menus.menu_id`
* `menu_allergies.allergy_id` → `allergies.allergy_id`

추천 시 사용 방식:

* 사용자 또는 모임 참여자의 알러지/제한 조건과 메뉴의 성분 정보가 겹치면 해당 메뉴는 추천 후보에서 제외한다.

---

### 6.15 `meeting_purposes`

약속 또는 식사의 목적을 저장하는 테이블이다.

| Attribute            | Type          | Key    | Null     | 설명       |
| -------------------- | ------------- | ------ | -------- | -------- |
| `meeting_purpose_id` | `BIGINT`      | PK     | NOT NULL | 약속 목적 ID |
| `name`               | `VARCHAR(30)` | UNIQUE | NOT NULL | 약속 목적 이름 |

기본 마스터 목록:

```text
가벼운 식사
든든한 식사
회식
데이트
팀플 식사
새로운 메뉴 시도
건강식
```

---

### 6.16 `menu_purpose_suitability`

특정 메뉴가 특정 약속 목적에 얼마나 적합한지 저장하는 테이블이다.

| Attribute            | Type     | Key    | Null     | 설명             |
| -------------------- | -------- | ------ | -------- | -------------- |
| `menu_id`            | `BIGINT` | PK, FK | NOT NULL | 메뉴 ID          |
| `meeting_purpose_id` | `BIGINT` | PK, FK | NOT NULL | 약속 목적 ID       |
| `suitability_score`  | `INT`    |        | NOT NULL | 목적 적합도 점수. 0~5 |

복합 기본키:

```text
(menu_id, meeting_purpose_id)
```

관계:

* `menu_purpose_suitability.menu_id` → `menus.menu_id`
* `menu_purpose_suitability.meeting_purpose_id` → `meeting_purposes.meeting_purpose_id`

비고:

* `suitability_score = 0`이면 해당 약속 목적에는 부적합한 메뉴로 간주하고 추천 후보에서 제외한다.
* `suitability_score = 1~5`인 메뉴만 후보에 남기며, 점수가 높을수록 모임 추천 점수에 더 크게 반영한다.
* ERD 또는 과거 문서에 `meal_purpose_id`라는 이름이 남아 있다면 `meeting_purpose_id`로 통일한다.

---

### 6.17 `meal_history`

사용자가 과거에 먹은 메뉴 기록을 저장하는 테이블이다.

| Attribute    | Type          | Key | Null     | 설명            |
| ------------ | ------------- | --- | -------- | ------------- |
| `history_id` | `BIGINT`      | PK  | NOT NULL | 식사 기록 ID      |
| `user_id`    | `BIGINT`      | FK  | NOT NULL | 사용자 ID        |
| `menu_id`    | `BIGINT`      | FK  | NOT NULL | 메뉴 ID         |
| `eaten_at`   | `TIMESTAMPTZ` |     | NOT NULL | 식사 일시         |
| `rating`     | `INT`         |     | NULL     | 식사 후 만족도. 1~5 |
| `memo`       | `TEXT`        |     | NULL     | 식사 메모         |

관계:

* `meal_history.user_id` → `users.user_id`
* `meal_history.menu_id` → `menus.menu_id`

활용 예시:

* 최근에 먹은 메뉴 감점
* 식사 기록 평점 평균을 메뉴 선호도 보정에 사용
* 최근 식사 중복 패널티 계산

---

### 6.18 `meetings`

메뉴 추천이 필요한 약속 정보를 저장하는 테이블이다. MVP에서는 반복 그룹 기능을 제외하므로 `group_id`는 사용하지 않는다.

| Attribute            | Type           | Key | Null     | 설명           |
| -------------------- | -------------- | --- | -------- | ------------ |
| `meeting_id`         | `BIGINT`       | PK  | NOT NULL | 약속 ID        |
| `title`              | `VARCHAR(100)` |     | NULL     | 약속 제목        |
| `meeting_time`       | `TIMESTAMPTZ`  |     | NOT NULL | 약속 날짜 및 시간   |
| `meeting_purpose_id` | `BIGINT`       | FK  | NOT NULL | 약속 목적 ID     |
| `location`           | `VARCHAR(255)` |     | NULL     | 약속 장소        |
| `created_by`         | `BIGINT`       | FK  | NOT NULL | 약속 생성자 ID    |
| `selected_menu_id`   | `BIGINT`       | FK  | NULL     | 최종 선택된 메뉴 ID |
| `status`             | `VARCHAR(20)`  |     | NOT NULL | 약속 진행 상태     |
| `created_at`         | `TIMESTAMPTZ`  |     | NOT NULL | 약속 생성 일시     |

관계:

* `meetings.meeting_purpose_id` → `meeting_purposes.meeting_purpose_id`
* `meetings.created_by` → `users.user_id`
* `meetings.selected_menu_id` → `menus.menu_id`

`status` 예시:

```text
CREATED
COLLECTING
RECOMMENDED
DECIDED
```

비고:

* 모임 추천 결과가 생성되면 `status`를 `RECOMMENDED`로 변경한다.
* 최종 메뉴가 확정되면 `selected_menu_id`에 메뉴 ID를 저장하고 `status`를 `DECIDED`로 변경한다.

---

### 6.19 `meeting_participants`

약속에 참여하는 사람 정보를 저장하는 테이블이다. 가입 사용자뿐 아니라 초대 링크로 들어온 게스트도 처리할 수 있도록 `participant_id`를 기본키로 사용한다.

| Attribute           | Type          | Key                                  | Null     | 설명                                       |
| ------------------- | ------------- | ------------------------------------ | -------- | ---------------------------------------- |
| `participant_id`    | `BIGINT`      | PK                                   | NOT NULL | 약속 참여자 고유 ID                             |
| `meeting_id`        | `BIGINT`      | FK                                   | NOT NULL | 약속 ID                                    |
| `user_id`           | `BIGINT`      | FK                                   | NULL     | 가입 사용자 또는 게스트 사용자 ID. 게스트 계정 삭제 후에는 NULL |
| `display_name`      | `VARCHAR(50)` | UNIQUE(`meeting_id`, `display_name`) | NOT NULL | 화면에 표시할 참여자 이름                           |
| `attendance_status` | `VARCHAR(20)` |                                      | NOT NULL | 참여 상태                                    |
| `joined_at`         | `TIMESTAMPTZ` |                                      | NULL     | 약속 참여 응답 일시                              |

관계:

* `meeting_participants.meeting_id` → `meetings.meeting_id`
* `meeting_participants.user_id` → `users.user_id` (`ON DELETE SET NULL`)

`attendance_status` 예시:

```text
JOINED
PENDING
DECLINED
```

추천 시 사용 방식:

* `attendance_status != 'DECLINED'`인 참여자를 추천 계산에 반영한다.
* 모임 상세 화면에서 구성원 칩을 끄면 해당 `user_id`는 추천 계산 요청의 `participantUserIds`에서 제외한다.
* 모임 메뉴가 확정되면 게스트의 `users` 및 Auth 계정은 삭제될 수 있지만, `display_name`은 남아 과거 참여 기록을 표시할 수 있다.
* 모임 생성자가 `meeting_participants`에 없더라도 백엔드 추천 계산에서는 생성자를 참여자로 보정해 포함한다.

---

### 6.20 `recommendation_runs`

모임 추천이 실행된 시점과 알고리즘 버전을 저장하는 로그 테이블이다. 같은 약속에서도 조건 변경 후 추천을 다시 실행할 수 있으므로 추천 실행 단위를 분리한다.

| Attribute           | Type          | Key | Null     | 설명                   |
| ------------------- | ------------- | --- | -------- | -------------------- |
| `run_id`            | `BIGINT`      | PK  | NOT NULL | 추천 실행 ID             |
| `meeting_id`        | `BIGINT`      | FK  | NOT NULL | 약속 ID                |
| `algorithm_version` | `VARCHAR(30)` |     | NOT NULL | 추천 알고리즘 버전           |
| `config_json`       | `JSONB`       |     | NULL     | 추천 실행 당시 사용한 설정값 스냅샷 |
| `generated_at`      | `TIMESTAMPTZ` |     | NOT NULL | 추천 생성 일시             |

관계:

* `recommendation_runs.meeting_id` → `meetings.meeting_id`

현재 모임 추천 알고리즘 버전:

```text
meeting-group-v2
```

`config_json` 예시:

```json
{
  "resultLimit": 3,
  "participantUserIds": [1, 2, 5],
  "budgetMin": 1,
  "budgetMax": 4
}
```

---

### 6.21 `meeting_recommendations`

모임 추천 실행별 메뉴 추천 결과를 저장하는 테이블이다. `run_id`를 통해 약속 정보와 연결되므로 `meeting_id`를 중복 저장하지 않는다.

| Attribute           | Type           | Key | Null     | 설명              |
| ------------------- | -------------- | --- | -------- | --------------- |
| `recommendation_id` | `BIGINT`       | PK  | NOT NULL | 추천 결과 ID        |
| `run_id`            | `BIGINT`       | FK  | NOT NULL | 추천 실행 ID        |
| `menu_id`           | `BIGINT`       | FK  | NOT NULL | 추천 메뉴 ID        |
| `rank_no`           | `INT`          |     | NOT NULL | 추천 순위           |
| `total_score`       | `DECIMAL(5,2)` |     | NOT NULL | 최종 추천 점수        |
| `scores_json`       | `JSONB`        |     | NULL     | 세부 점수 breakdown |
| `reason`            | `TEXT`         |     | NULL     | 추천 이유           |

권장 제약:

```text
UNIQUE(run_id, rank_no)
UNIQUE(run_id, menu_id)
```

관계:

* `meeting_recommendations.run_id` → `recommendation_runs.run_id`
* `meeting_recommendations.menu_id` → `menus.menu_id`

`scores_json` 예시:

```json
{
  "category_score": 24,
  "tag_score": 16,
  "menu_preference_score": 20,
  "budget_score": 10,
  "group_preference_score": 65.88,
  "minimum_participant_score": 52.94,
  "purpose_score": 20
}
```

---

### 6.22 `personal_recommendation_runs`

개인 추천이 실행된 시점과 알고리즘 버전을 저장하는 로그 테이블이다.

| Attribute           | Type          | Key | Null     | 설명                   |
| ------------------- | ------------- | --- | -------- | -------------------- |
| `run_id`            | `BIGINT`      | PK  | NOT NULL | 개인 추천 실행 ID          |
| `user_id`           | `BIGINT`      | FK  | NOT NULL | 추천을 요청한 사용자 ID       |
| `algorithm_version` | `VARCHAR(30)` |     | NOT NULL | 개인 추천 알고리즘 버전        |
| `config_json`       | `JSONB`       |     | NULL     | 추천 실행 당시 사용한 설정값 스냅샷 |
| `generated_at`      | `TIMESTAMPTZ` |     | NOT NULL | 추천 생성 일시             |

관계:

* `personal_recommendation_runs.user_id` → `users.user_id`

현재 개인 추천 알고리즘 버전:

```text
personal-simple-v2
```

`config_json` 예시:

```json
{
  "meetingPurposeId": 1,
  "recentDuplicateDays": 7,
  "includeNewMenu": true,
  "budgetMin": 1,
  "budgetMax": 4,
  "limit": 5
}
```

---

### 6.23 `personal_recommendation_results`

개인 추천 실행별 메뉴 추천 결과를 저장하는 테이블이다.

| Attribute           | Type           | Key | Null     | 설명                         |
| ------------------- | -------------- | --- | -------- | -------------------------- |
| `recommendation_id` | `BIGINT`       | PK  | NOT NULL | 개인 추천 결과 ID                |
| `run_id`            | `BIGINT`       | FK  | NOT NULL | 개인 추천 실행 ID                |
| `menu_id`           | `BIGINT`       | FK  | NOT NULL | 추천 메뉴 ID                   |
| `rank_no`           | `INT`          |     | NOT NULL | 추천 순위                      |
| `total_score`       | `DECIMAL(5,2)` |     | NOT NULL | 최종 추천 점수                   |
| `scores_json`       | `JSONB`        |     | NULL     | 세부 점수 breakdown            |
| `reason`            | `TEXT`         |     | NULL     | 추천 이유                      |
| `is_new_suggestion` | `BOOLEAN`      |     | NOT NULL | 사용자의 식사 기록에 없던 새로운 메뉴인지 여부 |

권장 제약:

```text
UNIQUE(run_id, rank_no)
UNIQUE(run_id, menu_id)
```

관계:

* `personal_recommendation_results.run_id` → `personal_recommendation_runs.run_id`
* `personal_recommendation_results.menu_id` → `menus.menu_id`

`scores_json` 예시:

```json
{
  "category_score": 35,
  "tag_score": 20,
  "menu_preference_score": 25,
  "budget_score": 15,
  "history_penalty": 0
}
```

---

## 7. View 상세 설계

### 7.1 `menu_recommendation_features`

추천 알고리즘에서 메뉴 후보 데이터를 효율적으로 읽기 위한 view이다. 메뉴 기본 정보와 카테고리명, 태그 ID 배열, 알러지 ID 배열을 한 번에 제공한다.

| Column          | Type       | 설명                |
| --------------- | ---------- | ----------------- |
| `menu_id`       | `BIGINT`   | 메뉴 ID             |
| `category_id`   | `BIGINT`   | 카테고리 ID           |
| `category_name` | `VARCHAR`  | 카테고리 이름           |
| `name`          | `VARCHAR`  | 메뉴 이름             |
| `price_level`   | `INT`      | 가격대               |
| `tag_ids`       | `BIGINT[]` | 메뉴에 연결된 태그 ID 배열  |
| `allergy_ids`   | `BIGINT[]` | 메뉴에 연결된 알러지 ID 배열 |

사용 위치:

* 개인 추천 후보 메뉴 로딩
* 모임 추천 후보 메뉴 로딩
* 알러지 충돌 필터링
* 태그 선호도 평균 계산
* 예산 조건 계산

---

## 8. RPC Function 상세 설계

### 8.1 `set_menu_interaction_state`

메뉴 좋아요/싫어요/북마크 상태를 원자적으로 설정하는 RPC 함수이다.

입력 파라미터:

| Parameter            | Type      | 설명                                 |
| -------------------- | --------- | ---------------------------------- |
| `p_user_id`          | `BIGINT`  | 사용자 ID                             |
| `p_menu_id`          | `BIGINT`  | 메뉴 ID                              |
| `p_interaction_type` | `TEXT`    | `like`, `dislike`, `bookmark` 중 하나 |
| `p_selected`         | `BOOLEAN` | 선택 여부                              |

반환 예시:

```json
{
  "menu_id": 1,
  "preference": "like",
  "bookmarked": true
}
```

처리 규칙:

* `p_selected = true`이면 해당 interaction type의 최신 상태를 추가한다.
* `p_selected = false`이면 해당 interaction type의 활성 상태를 해제한다.
* `like`를 선택하면 같은 메뉴의 `dislike` 상태는 해제한다.
* `dislike`를 선택하면 같은 메뉴의 `like` 상태는 해제한다.
* `bookmark`는 `like`/`dislike`와 별개로 유지한다.
* 존재하지 않는 메뉴 ID가 들어오면 에러를 반환한다.

---

## 9. 주요 관계 정리

### 9.1 사용자 관련 관계

* `users` 1 : 1 `user_preferences`
* `users` 1 : N `meal_history`
* `users` 1 : N `user_menu_interactions`
* `users` N : M `menus` through `user_menu_preferences`
* `users` N : M `menu_categories` through `user_category_preferences`
* `users` N : M `tags` through `user_tag_preferences`
* `users` N : M `allergies` through `user_allergies`
* `users` 1 : N `meetings` through `meetings.created_by`
* `users` 1 : N `meeting_participants`
* `users` 1 : N `personal_recommendation_runs`

### 9.2 메뉴 관련 관계

* `menu_categories` 1 : N `menus`
* `menu_categories` N : M `tags` through `category_tags`
* `menus` N : M `tags` through `menu_tags`
* `menus` N : M `allergies` through `menu_allergies`
* `menus` N : M `meeting_purposes` through `menu_purpose_suitability`
* `menus` 1 : N `meal_history`
* `menus` 1 : N `user_menu_interactions`
* `menus` 1 : N `meeting_recommendations`
* `menus` 1 : N `personal_recommendation_results`
* `menus` 1 : N `meetings` through `meetings.selected_menu_id`

### 9.3 약속 및 추천 관련 관계

* `meetings` N : 1 `meeting_purposes`
* `meetings` 1 : N `meeting_participants`
* `meetings` 1 : N `recommendation_runs`
* `recommendation_runs` 1 : N `meeting_recommendations`
* `personal_recommendation_runs` 1 : N `personal_recommendation_results`

---

## 10. 추천 로직에서의 데이터 사용 방식

### 10.1 후보 메뉴 필터링

추천 계산 전 먼저 추천 불가능하거나 적합하지 않은 메뉴를 제거한다.

공통 필터:

1. 사용자 또는 참여자의 알러지/제한 조건과 충돌하는 메뉴 제외
2. 목적 적합도 `suitability_score = 0`인 메뉴 제외
3. 명시적 비선호 점수 `0`인 메뉴 또는 카테고리 제외
4. 요청 조건에 맞지 않는 신규 메뉴 제외

개인 추천 추가 처리:

* 최근 식사 기록과 중복되는 메뉴는 제외하지 않고 감점한다.
* `includeNewMenu = false`이면 식사 기록이 없는 새로운 메뉴는 후보에서 제외한다.

모임 추천 추가 처리:

* 참여자 중 한 명이라도 메뉴 알러지와 충돌하면 제외한다.
* 참여자 중 한 명이라도 해당 메뉴 또는 카테고리를 명시적으로 `0`점으로 저장한 경우 제외한다.
* 현재 모임 추천에서는 개인 추천과 달리 최근 식사 중복 패널티를 사용하지 않는다.

---

### 10.2 개인 추천 점수 계산

개인 추천 알고리즘 버전:

```text
personal-simple-v2
```

개인 추천 기본 limit:

```text
5
```

개인 추천 점수는 최대 100점이다.

```text
totalScore = categoryScore + tagScore + menuPreferenceScore + budgetScore - historyPenalty
```

세부 점수:

| 항목        |    최대 점수 | 사용 데이터                                         |
| --------- | -------: | ---------------------------------------------- |
| 카테고리 선호도  |       35 | `user_category_preferences`                    |
| 태그 선호도    |       25 | `user_tag_preferences`, `menu_tags`            |
| 메뉴 선호도    |       25 | `user_menu_preferences`, `meal_history.rating` |
| 예산 적합도    |       15 | `menus.price_level`, `user_preferences`        |
| 최근 식사 패널티 | 최대 35 차감 | `meal_history.eaten_at`                        |

예산 점수 기준:

| 조건                       | 점수 |
| ------------------------ | -: |
| 메뉴 가격대가 없거나 예산 상한이 없는 경우 | 15 |
| 메뉴 가격대가 예산 상한보다 높은 경우    |  8 |
| 메뉴 가격대가 예산 하한보다 낮은 경우    | 12 |
| 메뉴 가격대가 예산 범위 안에 있는 경우   | 15 |

최근 식사 패널티:

```text
historyPenalty = 35 * (1 - daysSinceLastEaten / recentDuplicateDays)
```

사용되는 주요 테이블/View:

* `menu_recommendation_features`
* `user_preferences`
* `user_menu_preferences`
* `user_category_preferences`
* `user_tag_preferences`
* `user_allergies`
* `meal_history`
* `personal_recommendation_runs`
* `personal_recommendation_results`

---

### 10.3 모임 추천 점수 계산

모임 추천 알고리즘 버전:

```text
meeting-group-v2
```

기본 추천 설정값:

```json
{
  "resultLimit": 3
}
```

모임 추천은 참여자별로 카테고리, 태그, 메뉴 선호도, 예산 점수를 계산해 80점 만점으로 환산하고, `menu_purpose_suitability.suitability_score`를 20점 만점으로 더한다.

```text
participantRawScore = categoryScore + tagScore + menuPreferenceScore + budgetScore
participantPreferenceScore = participantRawScore / 85 * 80
meetingScore = average(participantPreferenceScore) + purposeScore
```

참여자별 점수 구성:

| 항목       | 최대 점수 | 사용 데이터                                         |
| -------- | ----: | ---------------------------------------------- |
| 카테고리 선호도 |    30 | `user_category_preferences`                    |
| 태그 선호도   |    20 | `user_tag_preferences`, `menu_tags`            |
| 메뉴 선호도   |    25 | `user_menu_preferences`, `meal_history.rating` |
| 예산 적합도   |    10 | `menus.price_level`, `user_preferences`        |

모임 목적 점수:

| 항목     | 최대 점수 | 사용 데이터                     |
| ------ | ----: | -------------------------- |
| 목적 적합도 |    20 | `menu_purpose_suitability` |

사용되는 주요 테이블/View:

* `meetings`
* `meeting_participants`
* `menu_recommendation_features`
* `menu_purpose_suitability`
* `user_preferences`
* `user_menu_preferences`
* `user_category_preferences`
* `user_tag_preferences`
* `user_allergies`
* `meal_history`
* `recommendation_runs`
* `meeting_recommendations`

---

### 10.4 추천 결과 저장

개인 추천:

1. `personal_recommendation_runs`에 추천 실행 로그를 저장한다.
2. `personal_recommendation_results`에 추천 메뉴별 결과를 저장한다.
3. `config_json`에는 추천 요청 당시의 필터와 설정을 저장한다.
4. `scores_json`에는 세부 점수 breakdown을 저장한다.

모임 추천:

1. `recommendation_runs`에 추천 실행 로그를 저장한다.
2. `meeting_recommendations`에 추천 메뉴별 결과를 저장한다.
3. 추천 결과가 생성되면 `meetings.status`를 `RECOMMENDED`로 변경한다.
4. 최종 선택된 메뉴가 있으면 `meetings.selected_menu_id`에 저장하고 `status`를 `DECIDED`로 변경한다.

---

## 11. MVP 기준 필수 테이블

```text
users
user_preferences
menus
menu_categories
tags
category_tags
menu_tags
user_menu_preferences
user_category_preferences
user_tag_preferences
user_menu_interactions
allergies
user_allergies
menu_allergies
meeting_purposes
menu_purpose_suitability
meal_history
meetings
meeting_participants
recommendation_runs
meeting_recommendations
personal_recommendation_runs
personal_recommendation_results
```

---

## 12. MVP 기준 필수 View/RPC/Storage

```text
menu_recommendation_features
set_menu_interaction_state
ui-assets
```

---

## 13. Seed Data 기준

`supabase/seed.sql`은 다음 마스터 데이터를 포함한다.

### 13.1 카테고리

```text
한식
중식
양식
일식
아시안
고기
패스트푸드
```

### 13.2 태그

```text
구이
국물
조림
찜
삶음
볶음
튀김
날것
매운맛
```

### 13.3 알러지/제한 조건

```text
알류
우유
메밀
땅콩
대두
밀
잣
호두
게
새우
오징어
고등어
조개류
복숭아
토마토
닭고기
돼지고기
쇠고기
아황산류
```

### 13.4 모임 목적

```text
가벼운 식사
든든한 식사
회식
데이트
팀플 식사
새로운 메뉴 시도
건강식
```

### 13.5 기본 메뉴 예시

```text
김치찌개
비빔밥
제육볶음
짜장면
마라탕
초밥
라멘
파스타
샐러드볼
쌀국수
```

---

## 14. 설계 요약

본 스키마는 메뉴 추천에 필요한 데이터를 문자열 중심이 아니라 정형 데이터 중심으로 저장한다. 메뉴 이름, 설명, 장소와 같은 정보는 `VARCHAR` 또는 `TEXT`로 저장하지만, 추천 계산에 직접 사용되는 선호도, 매운맛, 가격대, 목적 적합도, 예산 조건 등은 `INT`, `DECIMAL`, `JSONB` 형태로 수치화하거나 구조화한다.

개정안에서는 MVP 구현 범위를 고려해 반복 그룹, 시간대 추천, 투표 기능을 제외하고 약속방 중심 구조로 단순화했다. 또한 게스트 참여자를 처리하기 위해 `meeting_participants`에 `participant_id`와 `display_name` 스냅샷을 도입했고, 추천 결과는 개인 추천과 모임 추천을 분리해 저장한다.

현재 구현 기준에서 개인 추천은 `personal_recommendation_runs`와 `personal_recommendation_results`에 저장하고, 모임 추천은 `recommendation_runs`와 `meeting_recommendations`에 저장한다. 메뉴 feature는 `menu_recommendation_features` view로 통합해 추천 알고리즘에서 빠르게 조회할 수 있도록 한다. 사용자 메뉴 반응은 `user_menu_interactions`에 누적 저장하고, 좋아요/싫어요/북마크 상태 변경은 `set_menu_interaction_state` RPC로 처리한다.