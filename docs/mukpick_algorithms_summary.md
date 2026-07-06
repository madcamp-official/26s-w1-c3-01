# MUCPICK 추천 알고리즘 코드 분석 정리

분석 기준 파일: `26s-w1-c3-01-main.zip`  
분석 대상: 개인 추천 알고리즘, 모임 추천 알고리즘, 관련 DB/프론트 흐름

---

## 1. 먼저 봐야 하는 코드 위치

### 개인 추천 관련 코드

| 역할 | 파일 경로 | 확인 내용 |
|---|---|---|
| 개인 추천 API 라우팅 | `backend/src/modules/recommendations/recommendation.routes.ts` | `/recommendations/personal` GET/POST 엔드포인트 |
| 개인 추천 컨트롤러 | `backend/src/modules/recommendations/recommendation.controller.ts` | 로그인 사용자 ID를 꺼내 서비스 호출 |
| 개인 추천 서비스 | `backend/src/modules/recommendations/recommendation.service.ts` | DB 데이터 로딩 → 알고리즘 실행 → 추천 실행 결과 저장 |
| 개인 추천 Repository | `backend/src/modules/recommendations/recommendation.repository.ts` | 추천 계산에 필요한 DB 테이블 조회 |
| 개인 추천 알고리즘 | `backend/src/modules/recommendations/recommendation.algorithm.ts` | 실제 점수 계산식, 필터링, 랭킹 생성 |
| 개인 추천 DTO | `backend/src/modules/recommendations/recommendation.dto.ts` | 요청/응답 타입, 점수 breakdown 구조 |
| 개인 추천 validation | `backend/src/modules/recommendations/recommendation.validation.ts` | 요청 body 검증 조건 |
| 개인 추천 프론트 화면 | `frontend/src/features/recommendations/PersonalView.tsx` | 중복 패널티, 새 메뉴 포함, 예산 조건 UI |
| 개인 추천 API 호출 | `frontend/src/app/MukpickApp.tsx` | 프론트에서 추천 조건을 백엔드로 전달 |
| 프론트 추천 타입 | `frontend/src/features/recommendations/recommendation.types.ts` | 프론트에서 사용하는 추천 요청/응답 타입 |

### 모임 추천 관련 코드

| 역할 | 파일 경로 | 확인 내용 |
|---|---|---|
| 모임 추천 API | `backend/src/modules/meeting-recommendations/meetingRecommendation.routes.ts` | 모임별 추천 생성/조회/확정 API |
| 모임 추천 컨트롤러 | `backend/src/modules/meeting-recommendations/meetingRecommendation.controller.ts` | 요청을 서비스로 전달 |
| 모임 추천 서비스 | `backend/src/modules/meeting-recommendations/meetingRecommendation.service.ts` | 모임 소유자 검증, 참여자 선택, 추천 저장 |
| 모임 추천 Repository | `backend/src/modules/meeting-recommendations/meetingRecommendation.repository.ts` | 모임, 참여자, 메뉴, 선호도, 알러지, 식사기록 조회 |
| 모임 추천 알고리즘 | `backend/src/modules/meeting-recommendations/meetingRecommendation.algorithm.ts` | 목적 적합도, 참여자 선호도, 알러지, 최근 중복 필터링 |
| 모임 추천 DTO | `backend/src/modules/meeting-recommendations/meetingRecommendation.dto.ts` | 요청값, 결과값, config 구조 |
| 모임 추천 프론트 패널 | `frontend/src/features/meetings/MeetingRecommendationPanel.tsx` | 모임 추천 생성 버튼, 결과 표시, 메뉴 확정 |

### DB 스키마 관련 코드

| 파일 경로 | 확인 내용 |
|---|---|
| `supabase/migrations/20260703080344_mukpick_initial_schema.sql` | 메뉴, 카테고리, 태그, 알러지, 모임, 모임 추천 기본 테이블 |
| `supabase/migrations/20260706110000_add_personal_recommendation_scoring_tables.sql` | 개인 추천 점수 계산용 추가 테이블 |
| `supabase/migrations/20260706123000_make_menu_interaction_toggles_unique.sql` | 메뉴 interaction 중복 방지 인덱스 |

---

## 2. 전체 추천 구조 요약

현재 프로젝트에는 추천 알고리즘이 두 종류로 나뉘어 있다.

| 구분 | 알고리즘 버전 | 목적 | 핵심 파일 |
|---|---|---|---|
| 개인 추천 | `personal-weighted-v1` | 한 명의 사용자 선호도, 기록, 예산, 평점 기반 메뉴 추천 | `recommendation.algorithm.ts` |
| 모임 추천 | `meeting-v1` | 모임 참여자들의 선호도, 알러지, 모임 목적을 종합해 메뉴 추천 | `meetingRecommendation.algorithm.ts` |

두 알고리즘 모두 공통적으로 `menus` 전체를 후보로 가져온 뒤, 조건에 맞지 않는 메뉴를 제거하고 점수를 계산한 다음 상위 N개를 반환한다.

---

## 3. 개인 추천 알고리즘 정리

### 3.1 실행 흐름

개인 추천은 다음 순서로 실행된다.

```text
프론트 PersonalView
  ↓
recommendationsApi.createPersonal(body)
  ↓
POST /recommendations/personal
  ↓
recommendation.controller.ts
  ↓
recommendation.service.ts
  ↓
recommendation.repository.ts 에서 추천용 DB 데이터 로딩
  ↓
recommendation.algorithm.ts 의 rankPersonalMenus()
  ↓
personal_recommendation_runs / personal_recommendation_results 저장
  ↓
추천 결과 반환
```

### 3.2 프론트에서 보내는 추천 조건

프론트에서는 개인 추천 요청 시 다음 값을 보낸다.

```ts
recommendationsApi.createPersonal({
  recentDuplicateDays,
  includeNewMenu,
  limit: 3
});
```

또한 추천 호출 전에 예산 정보를 별도 API로 저장한다.

```ts
userPreferencesApi.update({
  budgetMin,
  budgetMax
});
```

즉, 프론트 기준으로 사용자가 조절할 수 있는 조건은 다음과 같다.

| 조건 | UI 위치 | 의미 |
|---|---|---|
| `recentDuplicateDays` | 개인 추천 화면 | 최근 N일 내 먹은 메뉴에 패널티 적용 여부 |
| `includeNewMenu` | 개인 추천 화면 | 새로운 메뉴를 추천 후보에 포함할지 여부 |
| `budgetMin` | 개인 추천 화면 | 예산 최소 단계 |
| `budgetMax` | 개인 추천 화면 | 예산 최대 단계 |
| `limit` | 코드에서 고정 | 추천 결과 개수, 현재 3개 |

### 3.3 백엔드 요청 타입

백엔드 DTO에는 다음 필드가 있다.

```ts
export type PersonalRecommendationRequest = {
  meetingPurposeId?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};
```

validation에는 다음 필드가 추가로 들어 있다.

```ts
recentDuplicateDays?: number;
```

프론트 타입에는 `recentDuplicateDays`도 들어 있다.

```ts
export type PersonalRecommendationRequest = {
  meetingPurposeId?: number;
  recentDuplicateDays?: number;
  excludeRecentDays?: number;
  limit?: number;
  includeNewMenu?: boolean;
};
```

### 3.4 개인 추천에서 조회하는 DB 데이터

`recommendation.repository.ts`의 `loadRecommendationBase()`에서 다음 데이터를 읽는다.

| 데이터 | 테이블 | 현재 알고리즘 사용 여부 | 용도 |
|---|---|---:|---|
| 메뉴 목록 | `menus` | O | 추천 후보 |
| 메뉴 카테고리 | `menu_categories` | O | 카테고리명 표시, 카테고리 선호도 계산 |
| 메뉴 태그 | `menu_tags` | X | 현재 개인 추천 점수에 미사용 |
| 메뉴 알러지 | `menu_allergies` | O | 사용자 알러지와 겹치는 메뉴 제외 |
| 목적 적합도 | `menu_purpose_suitability` | X | 현재 개인 추천 점수에 미사용 |
| 사용자 메뉴 선호도 | `user_menu_preferences` | X | 현재 개인 추천 점수에 미사용 |
| 사용자 카테고리 선호도 | `user_category_preferences` | O | `category_score` 계산 |
| 사용자 태그 선호도 | `user_tag_preferences` | X | 현재 개인 추천 점수에 미사용 |
| 사용자 알러지 | `user_allergies` | O | 후보 메뉴 제외 |
| 사용자 식사 기록 | `meal_history` | O | 먹은 횟수, 최근 반복, 평점 계산 |
| 전체 식사 평점 | `meal_history` | O | 전체 사용자 평점 보조 데이터 |
| 리뷰 | `reviews` | O | 메뉴 평균 평점, 리뷰 수 계산 |
| 사용자 예산 | `user_preferences` | O | 예산 적합도 계산 |
| 사용자 메뉴 상호작용 | `user_menu_interactions` | O | 개인 pick/dislike 기록 계산 |
| 전체 메뉴 상호작용 | `user_menu_interactions` | O | 메뉴 인기도 계산 |

핵심은 **많은 데이터를 불러오지만, 실제 개인 추천 계산에는 일부만 쓰인다**는 점이다.

### 3.5 개인 추천 후보 필터링

현재 개인 추천에서 후보에서 완전히 제외되는 경우는 하나다.

```text
사용자의 알러지와 메뉴의 알러지가 겹치면 제외
```

코드 흐름은 다음과 같다.

```ts
.filter((menu) => !hasUserAllergy(menu.menu_id, menuAllergiesMap, userAllergySet))
```

즉, 알러지는 단순 패널티가 아니라 **hard filter**이다. 알러지에 걸리는 메뉴는 점수를 계산하지 않고 추천 후보에서 제거된다.

### 3.6 개인 추천 점수 구조

개인 추천 점수는 여러 요소를 더한 뒤 0~100점으로 제한한다.

```text
total_score = category_score
            + rating_score
            + review_confidence_score
            + price_score
            + popularity_score
            + novelty_score
            + repeat_score
            + negative_feedback_score
```

마지막에 다음처럼 제한한다.

```ts
clamp(sum, 0, 100)
```

따라서 개인 추천 총점은 현재 코드 기준으로 **최소 0점, 최대 100점**이다.

### 3.7 개인 추천 점수 요소별 정의

| 요소 | 최대점 | 최소점 | 사용 데이터 | 의미 |
|---|---:|---:|---|---|
| `category_score` | 20 | 0 | `user_category_preferences` | 사용자가 해당 카테고리를 얼마나 선호하는지 |
| `rating_score` | 20 | 0 | `reviews`, `meal_history.rating` | 메뉴 평균 평점이 얼마나 높은지 |
| `review_confidence_score` | 10 | 0 | 리뷰/평점 개수 | 평점 데이터가 충분히 쌓였는지 |
| `price_score` | 15 | 0 | `menus.price_level`, `user_preferences` | 사용자 예산 단계와 메뉴 가격 단계가 맞는지 |
| `popularity_score` | 15 | 0 | 전체 `user_menu_interactions` | 전체 사용자 기준 인기 메뉴인지 |
| `novelty_score` | 10 | 0 | 사용자의 pick/식사 기록 | 사용자가 자주 먹지 않은 새로운 메뉴인지 |
| `repeat_score` | 5 | 0 | 최근 7일 pick/식사 기록 | 최근 반복 선택이 적은지 |
| `negative_feedback_score` | 5 | 0 | 최근 30일 dislike | 최근 싫어요가 없었는지 |
| **합계** | **100** | **0** |  |  |

### 3.8 요소별 계산식

#### 1. 카테고리 선호도 점수

```ts
category_score = clamp(10 + 2 * preferenceScore, 0, 20)
```

`preferenceScore`는 DB에서 `-5 ~ 5` 범위를 가진다.

| preferenceScore | category_score 해석 |
|---:|---:|
| -5 | 0점, 강한 비선호 카테고리 |
| 0 | 10점, 중립 |
| 5 | 20점, 강한 선호 카테고리 |

#### 2. 평점 점수

```ts
normalizedRating = (ratingAverage - 1) / 4
rating_score = 20 * normalizedRating^1.5
```

평점은 1~5점 기준이다. 평점 데이터가 없으면 기본 평균값 `3.8`을 사용한다.

| ratingAverage | 해석 |
|---:|---|
| 1 | 매우 낮은 평점, 0점에 가까움 |
| 3 | 중간 평점 |
| 5 | 최고 평점, 20점 |

#### 3. 리뷰 신뢰도 점수

```ts
review_confidence_score = 10 * (1 - exp(-reviewCount / 20))
```

리뷰 수가 많을수록 점수가 올라가지만, 일정 수준 이후에는 증가 폭이 줄어든다.

| reviewCount | 해석 |
|---:|---|
| 0 | 데이터 신뢰도 낮음 |
| 20 | 어느 정도 신뢰 가능 |
| 매우 큼 | 10점에 가까워짐 |

#### 4. 가격 적합도 점수

현재 DB에는 실제 가격이 없고 `price_level`만 있다. 따라서 예산도 실제 금액이 아니라 1~5단계로 해석한다.

```text
price_level: 1~5
budget_min: 예산 최소 단계
budget_max: 예산 최대 단계
```

계산 규칙은 다음과 같다.

| 상황 | 점수 |
|---|---:|
| 메뉴 가격이나 예산 최대값이 없을 때 | 10점 |
| 가격이 예산 범위 안에 있을 때 | 15점 |
| 가격이 예산 최소보다 낮을 때 | 약간 감점 |
| 가격이 예산 최대보다 높을 때 | 초과 정도에 따라 지수적으로 감점 |

#### 5. 인기도 점수

전체 사용자의 메뉴 상호작용을 가중합으로 계산한다.

```ts
pick: 1
like: 0.7
bookmark: 0.5
view: 0.2
dislike: 0
```

이 값을 `popularityRaw`로 만들고, 전체 메뉴 중 가장 높은 값을 기준으로 로그 정규화한다.

```ts
popularity_score = 15 * log(1 + popularityRaw) / log(1 + maxPopularityRaw)
```

상호작용이 하나도 없으면 기본값으로 7.5점을 준다.

#### 6. 신규성 점수

사용자가 해당 메뉴를 얼마나 적게 먹었는지를 본다.

```ts
novelty_score = 10 * exp(-userPickCount / 3)
```

| userPickCount | 해석 |
|---:|---|
| 0 | 아직 먹지 않은 메뉴, 높은 신규성 |
| 많음 | 자주 먹은 메뉴, 낮은 신규성 |

#### 7. 최근 반복 패널티 점수

최근 7일 동안 해당 메뉴를 먹거나 pick한 횟수를 본다.

```ts
repeat_score = 5 * exp(-recentPickCount7d / 2)
```

| recentPickCount7d | 해석 |
|---:|---|
| 0 | 최근 반복 없음, 5점에 가까움 |
| 많음 | 최근 자주 먹음, 0점에 가까움 |

중요한 점은 현재 코드에서 기간이 **무조건 7일로 하드코딩**되어 있다는 것이다.

#### 8. 최근 부정 피드백 점수

최근 30일 내 dislike가 있으면 0점, 없으면 5점이다.

```ts
negative_feedback_score = hasRecentDislike30d ? 0 : 5
```

### 3.9 개인 추천 결과 reason 생성 방식

점수 계산 후 일부 조건을 만족하면 설명 문구를 만든다.

| 조건 | reason 문구 |
|---|---|
| `category_score >= 16` | 선호도가 높은 카테고리의 메뉴 |
| `rating_score >= 15` | 평점이 높은 메뉴 |
| `review_confidence_score >= 6` | 리뷰 수가 충분해 신뢰도 높음 |
| `price_score >= 14` | 예산 범위에 잘 맞음 |
| `popularity_score >= 11` | 많은 사용자가 선택한 인기 메뉴 |
| `novelty_score >= 8` | 자주 선택하지 않은 새로운 메뉴 |
| `repeat_score >= 4` | 최근 반복 선택이 적음 |
| 최근 dislike 있음 | 부정 피드백이 점수에 낮게 반영됨 |

최종 reason은 최대 2개 문구만 선택한다.

---

## 4. 개인 추천 알고리즘의 부족한 부분

### 4.1 `recentDuplicateDays`가 실제 계산에 반영되지 않음

프론트는 다음 값을 보낸다.

```ts
recentDuplicateDays
```

하지만 백엔드 개인 추천 알고리즘은 항상 7일 기준만 사용한다.

```ts
function getRecentPickCount7dMap(base: RecommendationBaseData) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
}
```

따라서 사용자가 UI에서 `1일`, `3일`, `7일`, `14일`, `사용 안 함`을 선택해도 실제 계산 결과는 동일하게 7일 기준으로 처리된다.

수정 방향:

```text
getRecentPickCountMap(base, input.recentDuplicateDays ?? input.excludeRecentDays ?? 7)
```

처럼 요청값을 함수에 전달해야 한다.

### 4.2 `includeNewMenu`가 실제 후보 필터링에 반영되지 않음

프론트는 새로운 메뉴 포함 여부를 보낸다.

```ts
includeNewMenu
```

하지만 백엔드에서는 이 값을 사용하지 않는다. 현재는 사용자가 `새로운 메뉴 포함`을 꺼도, `userPickCount === 0`인 메뉴가 추천될 수 있다.

수정 방향은 둘 중 하나다.

| 방식 | 설명 |
|---|---|
| 후보 제외 방식 | `includeNewMenu === false`이면 먹은 적 없는 메뉴를 후보에서 제외 |
| 점수 조정 방식 | 새 메뉴는 후보에 남기되 `novelty_score`를 0점 또는 낮은 점수로 조정 |

현재 UI 문구상으로는 **후보 제외 방식**이 더 직관적이다.

### 4.3 메뉴 직접 선호도가 미사용 상태

DB에는 `user_menu_preferences`가 있고 Repository에서도 조회한다.

```text
user_menu_preferences(menu_id, preference_score)
```

하지만 개인 추천 점수에는 반영하지 않는다.

현재 문제:

```text
사용자가 특정 메뉴를 좋아요/싫어요로 직접 설정해도 개인 추천 점수에 영향이 없음
```

수정 방향:

```text
menu_preference_score 요소 추가
예: -5~5 선호도를 0~15점 또는 -패널티~+보너스로 변환
```

### 4.4 태그 선호도가 미사용 상태

DB에는 `user_tag_preferences`와 `menu_tags`가 있고 Repository에서도 조회한다.

하지만 개인 추천 계산에는 쓰지 않는다.

현재 문제:

```text
매운맛, 국물, 구이, 튀김, 볶음 같은 태그 선호도가 개인 추천에 반영되지 않음
```

수정 방향:

```text
메뉴의 tag_id 목록을 구함
각 tag_id에 대한 사용자 preference_score 평균 또는 합산 계산
tag_preference_score로 총점에 반영
```

### 4.5 모임 목적 적합도가 개인 추천에 미사용 상태

개인 추천 요청에는 `meetingPurposeId`가 있고, Repository도 `menu_purpose_suitability`를 조회한다.

하지만 알고리즘에서는 사용하지 않는다.

현재 문제:

```text
개인 추천에서도 목적 기반 추천을 하려는 구조는 있지만 실제 계산에는 미반영
```

개인 추천이 정말 순수 개인 추천이라면 제거해도 되고, 목적 기반 개인 추천을 원한다면 점수 요소로 추가해야 한다.

### 4.6 `excludeRecentDays`와 `recentDuplicateDays`가 혼재되어 있음

개인 추천 DTO에는 `excludeRecentDays`가 있고 validation에는 `recentDuplicateDays`도 있다.

```text
excludeRecentDays
recentDuplicateDays
```

둘 다 비슷한 의미라서 API 설계가 헷갈릴 수 있다.

수정 방향:

```text
recentDuplicateDays 하나로 통일
또는 excludeRecentDays를 deprecated 처리
```

### 4.7 예산 반영 방식이 프론트 흐름에 의존함

개인 추천 API body에는 예산이 직접 들어가지 않는다. 예산은 추천 호출 전에 `userPreferencesApi.update()`로 저장한 뒤, 추천 알고리즘이 DB에서 다시 읽는다.

문제는 프론트에서 예산 저장 실패를 무시한다는 점이다.

```ts
try {
  await userPreferencesApi.update(...)
} catch {
  // 예산 API가 없어도 추천 기능 계속 사용
}
```

따라서 예산 저장이 실패하면 사용자가 고른 예산 조건이 추천에 반영되지 않을 수 있다.

수정 방향:

```text
추천 API body에 budgetMin/budgetMax를 직접 포함
또는 예산 저장 실패 시 사용자에게 명확히 알림
```

### 4.8 인기도가 추천 노출에 의해 왜곡될 수 있음

프론트는 추천 결과를 받은 뒤 추천된 메뉴마다 `view` interaction을 자동 저장한다.

```ts
menuInteractionsApi.create(item.menuId!, "view")
```

그런데 인기도 점수에서 `view`는 0.2점으로 반영된다.

즉, 추천에 자주 노출되는 메뉴가 다시 인기도가 올라가고, 그 결과 더 자주 추천되는 순환이 생길 수 있다.

수정 방향:

```text
추천 노출 view와 사용자의 자발적 view를 분리
또는 view 가중치를 더 낮춤
또는 popularity 계산에서 추천 노출 view 제외
```

---

## 5. 모임 추천 알고리즘 정리

### 5.1 실행 흐름

모임 추천은 다음 흐름으로 실행된다.

```text
프론트 MeetingRecommendationPanel
  ↓
meetingsApi.createRecommendation(meetingId, body)
  ↓
모임 추천 API
  ↓
meetingRecommendation.controller.ts
  ↓
meetingRecommendation.service.ts
  ↓
모임 소유자 권한 확인
  ↓
meetingRecommendation.repository.ts 에서 추천용 DB 데이터 로딩
  ↓
meetingRecommendation.algorithm.ts 의 rankMeetingMenus()
  ↓
recommendation_runs / meeting_recommendations 저장
  ↓
meetings.status = RECOMMENDED 변경
  ↓
추천 결과 반환
```

### 5.2 프론트에서 보내는 추천 조건

현재 프론트의 `MeetingRecommendationPanel.tsx`에서는 추천 생성 시 다음 값을 고정으로 보낸다.

```ts
meetingsApi.createRecommendation(meetingId, {
  resultLimit: 3,
  recentDuplicateDays: 3
})
```

즉, 모임 추천에서는 현재 UI상으로 사용자가 조건을 조절하기보다는, 기본값으로 3개 결과와 최근 3일 중복 제외를 사용한다.

### 5.3 모임 추천 기본 config

`meetingRecommendation.algorithm.ts`의 기본값은 다음과 같다.

```ts
const DEFAULT_CONFIG = {
  menuPreference: 0.5,
  categoryPreference: 0.3,
  tagPreference: 0.2,
  averageScore: 0.7,
  minimumScore: 0.3,
  strongDislikePenalty: 20,
  strongDislikeScore: -3,
  recentDuplicateDays: 3,
  resultLimit: 3
};
```

각 값의 의미는 다음과 같다.

| config | 의미 |
|---|---|
| `menuPreference` | 참여자들의 메뉴 직접 선호도 가중치 |
| `categoryPreference` | 참여자들의 카테고리 선호도 가중치 |
| `tagPreference` | 참여자들의 태그 선호도 가중치 |
| `averageScore` | 과거 평점 평균 반영 가중치 |
| `minimumScore` | 결과로 인정할 최소 점수 |
| `strongDislikePenalty` | 강한 비선호가 있을 때 감점 크기 |
| `strongDislikeScore` | 강한 비선호로 판단하는 선호도 기준 |
| `recentDuplicateDays` | 최근 N일 내 먹은 메뉴 제외 기준 |
| `resultLimit` | 반환할 추천 결과 개수 |
| `participantUserIds` | 일부 참여자만 추천 계산에 포함할 때 사용하는 선택값 |

### 5.4 모임 추천에서 조회하는 DB 데이터

| 데이터 | 테이블 | 사용 여부 | 용도 |
|---|---|---:|---|
| 모임 정보 | `meetings` | O | 모임 목적, 생성자 권한 확인 |
| 모임 참여자 | `meeting_participants` | O | 추천 계산 대상 사용자 목록 |
| 메뉴 목록 | `menus` | O | 추천 후보 |
| 메뉴 태그 | `menu_tags` | O | 태그 선호도 계산 |
| 메뉴 알러지 | `menu_allergies` | O | 참여자 알러지와 겹치는 메뉴 제외 |
| 목적 적합도 | `menu_purpose_suitability` | O | 모임 목적에 맞는 메뉴인지 계산 |
| 사용자 메뉴 선호도 | `user_menu_preferences` | O | 참여자 메뉴 직접 선호도 계산 |
| 사용자 카테고리 선호도 | `user_category_preferences` | O | 참여자 카테고리 선호도 계산 |
| 사용자 태그 선호도 | `user_tag_preferences` | O | 참여자 태그 선호도 계산 |
| 사용자 알러지 | `user_allergies` | O | 알러지 메뉴 제외 |
| 식사 기록 | `meal_history` | O | 최근 중복 제외, 과거 평점 반영 |

### 5.5 모임 추천 후보 필터링

모임 추천에서는 개인 추천보다 후보 필터링이 강하다.

후보에서 제외되는 경우는 다음과 같다.

| 제외 조건 | 설명 |
|---|---|
| 참여자 중 한 명이라도 알러지가 겹치는 메뉴 | `hasAllergy()`로 제외 |
| 최근 N일 내 참여자 중 누군가 먹은 메뉴 | `getRecentMenuSet()` 기준으로 제외 |
| 모임 목적 적합도 점수가 0 이하인 메뉴 | `purposeScore <= 0`이면 제외 |

즉, 모임 추천에서 알러지와 최근 중복은 점수 감점이 아니라 **hard filter**이다.

### 5.6 모임 추천 점수 구조

모임 추천은 개인 추천과 다르게 명시적인 100점 제한이 없다.

현재 계산식은 다음과 같다.

```text
totalScore = purposeScore * 20
           + menuPreferenceScore * 20 * menuPreference
           + categoryPreferenceScore * 20 * categoryPreference
           + tagPreferenceScore * 20 * tagPreference
           + (ratingAverage - 3) * 10 * averageScore
           - strongDislikeCount * strongDislikePenalty
```

기본 config를 대입하면 다음과 같다.

```text
totalScore = purposeScore * 20
           + menuPreferenceScore * 10
           + categoryPreferenceScore * 6
           + tagPreferenceScore * 4
           + (ratingAverage - 3) * 7
           - strongDislikeCount * 20
```

### 5.7 모임 추천 점수 요소별 정의

| 요소 | 사용 데이터 | 현재 범위/특징 | 의미 |
|---|---|---|---|
| `purposeScore` | `menu_purpose_suitability.suitability_score` | 0~5 | 모임 목적에 맞는 메뉴인지 |
| `menuPreferenceScore` | `user_menu_preferences.preference_score` | 보통 -5~5 | 참여자들이 특정 메뉴를 직접 선호하는지 |
| `categoryPreferenceScore` | `user_category_preferences.preference_score` | 보통 -5~5 | 참여자들이 메뉴 카테고리를 선호하는지 |
| `tagPreferenceScore` | `user_tag_preferences.preference_score` + `menu_tags` | 태그 수에 따라 커질 수 있음 | 메뉴가 참여자 선호 태그를 포함하는지 |
| `ratingAverage` | `meal_history.rating` | 1~5 | 참여자들이 과거에 준 평균 평점 |
| `strongDislikeCount` | `user_menu_preferences.preference_score` | `<= -3` 개수 | 강한 비선호를 가진 참여자 수 |

### 5.8 모임 추천 요소별 계산 방식

#### 1. 목적 적합도

```ts
totalScore = purposeScore * 20
```

`purposeScore`는 0~5이다.

| purposeScore | 점수 | 해석 |
|---:|---:|---|
| 0 | 후보 제외 | 목적에 맞지 않음 |
| 1 | 20점 | 약한 적합 |
| 3 | 60점 | 보통 이상 적합 |
| 5 | 100점 | 매우 적합 |

주의할 점은 목적 적합도 하나만으로도 이미 100점까지 갈 수 있다는 것이다.

#### 2. 메뉴 직접 선호도

```ts
menuPreferenceScore = 평균 선호도 / 참여자 수 기준
추가점 = menuPreferenceScore * 20 * 0.5
```

기본 config에서는 다음과 같다.

```text
추가점 = menuPreferenceScore * 10
```

예를 들어 참여자 평균 메뉴 선호도가 3이면 30점을 더한다.

#### 3. 카테고리 선호도

```ts
categoryPreferenceScore = 평균 카테고리 선호도
추가점 = categoryPreferenceScore * 20 * 0.3
```

기본 config에서는 다음과 같다.

```text
추가점 = categoryPreferenceScore * 6
```

#### 4. 태그 선호도

```ts
tagPreferenceScore = 메뉴가 가진 각 태그에 대한 참여자 평균 선호도 합
추가점 = tagPreferenceScore * 20 * 0.2
```

기본 config에서는 다음과 같다.

```text
추가점 = tagPreferenceScore * 4
```

중요한 점은 태그가 여러 개면 선호도 합이 커질 수 있다는 것이다. 따라서 태그가 많은 메뉴가 구조적으로 유리해질 수 있다.

#### 5. 과거 평점

```ts
추가점 = (ratingAverage - 3) * 10 * 0.7
```

기본 config에서는 다음과 같다.

```text
추가점 = (ratingAverage - 3) * 7
```

| ratingAverage | 점수 영향 |
|---:|---:|
| 1 | -14점 |
| 3 | 0점 |
| 5 | +14점 |

#### 6. 강한 비선호 패널티

```ts
strongDislikeCount = preference_score <= -3 인 참여자 수
감점 = strongDislikeCount * 20
```

강한 비선호가 있는 메뉴는 참여자 수만큼 큰 감점을 받는다.

---

## 6. 모임 추천 알고리즘의 부족한 부분

### 6.1 총점이 100점을 넘을 수 있음

개인 추천은 최종 점수를 0~100으로 clamp한다.

하지만 모임 추천은 점수 상한이 없다.

특히 목적 적합도만으로도 다음처럼 100점이 될 수 있다.

```text
purposeScore = 5
purposeScore * 20 = 100
```

여기에 메뉴 선호도, 카테고리 선호도, 태그 선호도, 평점 점수가 더해지기 때문에 실제 점수는 100점을 쉽게 넘을 수 있다.

이전에 정리한 요구사항처럼 모든 추천 점수를 100점 이하로 맞추려면 모임 추천은 수정이 필요하다.

수정 방향:

```text
1. 각 요소의 최대 기여도를 재분배해 합계 100점으로 제한
2. 최종 totalScore를 clamp(0, 100) 처리
3. 목적 적합도를 100점 만점이 아니라 20~30점 범위로 축소
```

### 6.2 목적 적합도 비중이 너무 큼

현재 목적 적합도는 최대 100점이다.

```text
purposeScore 5점 → 100점
```

따라서 참여자 선호도보다 목적 적합도가 지나치게 큰 기준이 된다. 모임 추천에서는 목적이 중요하긴 하지만, 참여자 선호도를 같이 반영하려면 비중 조정이 필요하다.

추천 수정 예시:

| 요소 | 권장 최대점 |
|---|---:|
| 목적 적합도 | 25 |
| 메뉴 직접 선호도 | 20 |
| 카테고리 선호도 | 15 |
| 태그 선호도 | 15 |
| 과거 평점 | 10 |
| 최근 중복 회피 | 10 |
| 강한 비선호/알러지 안전성 | 5 또는 hard filter |
| 합계 | 100 |

### 6.3 태그가 많은 메뉴가 유리할 수 있음

현재 태그 선호도는 메뉴의 모든 태그 점수를 합산한다.

```ts
const tagPreferenceScore = tagIds.reduce(
  (sum, tagId) => sum + average(tagPreferenceMap.get(tagId) ?? [], participantCount),
  0
);
```

따라서 태그가 1개인 메뉴보다 태그가 3개인 메뉴가 더 많은 점수 기회를 가진다.

수정 방향:

```text
태그 선호도 합산 대신 평균 사용
또는 태그 점수 최대치를 정해 clamp 처리
```

### 6.4 최근 중복 메뉴를 완전히 제외하는 방식이 너무 강할 수 있음

현재 모임 추천은 최근 N일 내 참여자 중 누군가 먹은 메뉴를 완전히 제외한다.

```ts
.filter((menu) => !recentMenuSet.has(Number(menu.menu_id)))
```

참여자가 많을수록 최근에 누군가 먹은 메뉴가 많아져 추천 후보가 과도하게 줄어들 수 있다.

수정 방향:

```text
hard filter 대신 감점 방식으로 변경
예: 최근 먹은 참여자 수에 따라 repeat_penalty 적용
```

### 6.5 알러지도 hard filter로만 처리됨

알러지는 안전 문제이므로 hard filter가 맞다. 다만 현재 구조에서는 참여자 한 명의 알러지만 있어도 해당 메뉴를 완전히 제외한다.

이 방식은 안전성 측면에서는 적절하지만, 추후 “알러지 없는 참여자만 먹는 옵션” 같은 기능이 생긴다면 구조를 분리해야 한다.

현재 프로젝트 단계에서는 hard filter 유지가 적절하다.

### 6.6 결과에 점수 breakdown이 저장되지 않음

개인 추천은 `scores_json`에 요소별 점수를 저장한다.

```text
personal_recommendation_results.scores_json
```

반면 모임 추천은 `meeting_recommendations`에 `total_score`와 `reason`만 저장한다.

따라서 나중에 디버깅할 때 다음을 알기 어렵다.

```text
이 메뉴가 목적 때문에 높은지
참여자 선호도 때문에 높은지
태그 때문에 높은지
평점 때문에 높은지
```

수정 방향:

```text
meeting_recommendations 테이블에 scores_json 추가
모임 추천 결과에도 breakdown 반환
```

### 6.7 사용자 interaction 데이터가 모임 추천에는 반영되지 않음

개인 추천은 `user_menu_interactions`를 사용해 pick, like, bookmark, dislike, view를 반영한다.

모임 추천은 `user_menu_preferences`, `meal_history`는 사용하지만 `user_menu_interactions`는 사용하지 않는다.

즉, 사용자가 앱 안에서 누른 like/bookmark/dislike가 모임 추천에는 직접 반영되지 않는다.

수정 방향:

```text
모임 추천 Repository에서도 user_menu_interactions 조회
like/bookmark/pick/dislike를 참여자 선호도 보조 신호로 반영
```

---

## 7. 개인 추천과 모임 추천 비교

| 항목 | 개인 추천 | 모임 추천 |
|---|---|---|
| 알고리즘 버전 | `personal-weighted-v1` | `meeting-v1` |
| 점수 최대값 | 100점으로 제한 | 제한 없음, 100점 초과 가능 |
| 알러지 처리 | hard filter | hard filter |
| 최근 중복 처리 | 최근 7일 고정 패널티 | 최근 N일 hard filter |
| 프론트 조건 반영 | 일부 미반영 | 기본값 고정 전달 |
| 카테고리 선호도 | 사용 | 사용 |
| 메뉴 직접 선호도 | 미사용 | 사용 |
| 태그 선호도 | 미사용 | 사용 |
| 목적 적합도 | 미사용 | 사용 |
| 리뷰/평점 | 사용 | meal_history 평점 사용 |
| 전체 인기도 | 사용 | 미사용 |
| 사용자 interaction | 사용 | 미사용 |
| 점수 breakdown 저장 | O | X |
| 결과 저장 테이블 | `personal_recommendation_results` | `meeting_recommendations` |

---

## 8. 현재 구현 정확성 판단

### 개인 추천 판단

개인 추천은 기본적인 추천 구조는 구현되어 있다.

잘 구현된 부분:

```text
- 알러지 메뉴 제외
- 카테고리 선호도 반영
- 평점 반영
- 리뷰 신뢰도 반영
- 예산 단계 반영
- 전체 사용자 인기도 반영
- 신규성 반영
- 최근 반복 패널티 반영
- 최근 dislike 반영
- 총점 0~100 제한
- 추천 실행 결과 저장
```

하지만 정확한 추천 알고리즘이라고 보기에는 부족한 부분이 있다.

부족한 부분:

```text
- recentDuplicateDays가 무시되고 7일로 고정됨
- includeNewMenu가 무시됨
- user_menu_preferences가 계산에 쓰이지 않음
- user_tag_preferences와 menu_tags가 계산에 쓰이지 않음
- meetingPurposeId와 menu_purpose_suitability가 계산에 쓰이지 않음
- excludeRecentDays와 recentDuplicateDays가 혼재되어 API 의미가 불명확함
- 예산은 추천 body가 아니라 별도 저장 API에 의존함
```

따라서 개인 추천은 **부분 구현 상태**로 보는 것이 맞다.

### 모임 추천 판단

모임 추천은 개인 추천보다 다양한 선호도 데이터를 실제로 더 많이 사용한다.

잘 구현된 부분:

```text
- 모임 목적 적합도 반영
- 참여자 메뉴 직접 선호도 반영
- 참여자 카테고리 선호도 반영
- 참여자 태그 선호도 반영
- 참여자 알러지 메뉴 제외
- 최근 중복 메뉴 제외
- 과거 평점 반영
- 강한 비선호 패널티 반영
- 일부 참여자만 선택해 계산 가능
- 추천 실행 결과 저장
- 모임 상태 RECOMMENDED로 변경
```

부족한 부분:

```text
- 총점이 100점을 넘을 수 있음
- 목적 적합도 비중이 너무 큼
- 태그 수가 많은 메뉴가 유리해질 수 있음
- 최근 중복을 감점이 아니라 후보 제외로 처리해 후보가 과도하게 줄 수 있음
- 점수 breakdown을 저장하지 않음
- user_menu_interactions를 반영하지 않음
```

따라서 모임 추천은 기능 요소는 많이 들어갔지만, 점수 정규화와 설명 가능성 측면에서 수정이 필요하다.

---

## 9. 추천 알고리즘 개선 우선순위

### 1순위: 개인 추천 요청 조건 실제 반영

가장 먼저 고쳐야 할 부분은 프론트에서 보내는 조건을 백엔드가 실제로 사용하게 만드는 것이다.

```text
- recentDuplicateDays 반영
- includeNewMenu 반영
- excludeRecentDays / recentDuplicateDays 정리
```

### 2순위: 개인 추천에 메뉴/태그 선호도 반영

현재 DB와 프론트 구조상 메뉴 선호도와 태그 선호도를 쓸 수 있는데, 개인 추천 알고리즘에서 빠져 있다.

```text
- user_menu_preferences 반영
- user_tag_preferences + menu_tags 반영
```

### 3순위: 모임 추천 점수 100점 정규화

모임 추천은 현재 총점이 100을 넘을 수 있다. 프로젝트 문서에서 점수 최대값을 100으로 유지하려면 반드시 수정해야 한다.

```text
- 목적 적합도 최대점 축소
- 각 요소 최대점 재분배
- 최종 clamp(0, 100)
```

### 4순위: 점수 breakdown 통일

개인 추천처럼 모임 추천도 요소별 점수를 저장하면 디버깅과 발표 설명이 쉬워진다.

```text
- meeting_recommendations.scores_json 추가
- API 응답에 score breakdown 포함
```

### 5순위: 이미지 매칭 구조 정리

현재 프론트의 `menuAsset(menuId)`는 `ui-assets/menus/{menuId}.png`를 기대한다. 하지만 Storage에는 메뉴별 이미지가 없고 카테고리/태그/알러지 이미지만 있다.

따라서 추천 결과 화면에서 이미지를 안정적으로 보여주려면 다음 중 하나를 선택해야 한다.

```text
1. menus/{menu_id}.png 형태로 메뉴별 이미지를 Storage에 추가
2. menus 테이블에 image_path 컬럼 추가
3. 현재 구조에 맞춰 categoryName 기준 카테고리 이미지 사용
```

지금 DB/Storage 기준으로는 3번이 가장 빠르다.

---

## 10. 빠르게 이해하기 위한 요약

### 개인 추천 한 줄 요약

```text
개인 추천은 카테고리 선호도, 평점, 예산, 인기도, 신규성, 반복 회피, dislike를 더해 100점 만점으로 메뉴를 고르는 구조다.
```

하지만 현재는 다음이 빠져 있다.

```text
프론트에서 보낸 최근 중복 일수, 새 메뉴 포함 여부, 메뉴 직접 선호도, 태그 선호도, 목적 적합도
```

### 모임 추천 한 줄 요약

```text
모임 추천은 모임 목적에 맞는 메뉴 중에서 참여자들의 메뉴/카테고리/태그 선호도와 과거 평점을 더하고, 알러지와 최근 중복 메뉴를 제외하는 구조다.
```

하지만 현재는 다음 문제가 있다.

```text
점수가 100점을 넘을 수 있고, 목적 적합도 비중이 너무 크며, 요소별 점수 breakdown이 저장되지 않는다.
```

---

## 11. Codex 수정 작업용 핵심 지시 요약

아래 내용은 바로 작업 프롬프트로 사용할 수 있다.

```text
MUCPICK 프로젝트의 추천 알고리즘을 수정해줘.

1. 개인 추천 알고리즘 수정
- backend/src/modules/recommendations/recommendation.dto.ts에 recentDuplicateDays를 명시적으로 추가한다.
- recentDuplicateDays와 excludeRecentDays의 의미를 정리하고, 가능하면 recentDuplicateDays를 우선 사용한다.
- getRecentPickCount7dMap을 getRecentPickCountMap(base, days) 형태로 바꾸고, input.recentDuplicateDays 값을 실제 repeat_score 계산에 반영한다.
- includeNewMenu가 false이면 userPickCount가 0인 메뉴를 후보에서 제외하거나, 최소한 신규성 점수를 낮추도록 구현한다.
- 현재 repository에서 불러오지만 사용하지 않는 userMenuPreferences를 개인 추천 점수에 반영한다.
- menuTags와 userTagPreferences를 사용해서 tag_preference_score를 추가한다.
- 필요하다면 meetingPurposeId와 menu_purpose_suitability를 개인 추천 목적 적합도 점수로 반영한다.
- 개인 추천 총점은 계속 0~100을 넘지 않도록 유지한다.
- RecommendationScoreBreakdown 타입과 scores_json 저장 구조도 새 점수 요소에 맞게 확장한다.

2. 모임 추천 알고리즘 수정
- backend/src/modules/meeting-recommendations/meetingRecommendation.algorithm.ts의 totalScore가 100점을 넘지 않도록 점수 체계를 재설계한다.
- purposeScore * 20으로 목적 적합도만 100점이 되는 현재 구조를 수정한다.
- 목적 적합도, 메뉴 선호도, 카테고리 선호도, 태그 선호도, 평점, 최근 중복 회피, 강한 비선호 패널티의 최대/최소 범위를 명확히 나눈다.
- 태그 선호도는 태그 수가 많은 메뉴가 과도하게 유리하지 않도록 평균 또는 clamp를 적용한다.
- 모임 추천 결과에도 개인 추천처럼 scores_json 또는 breakdown을 추가해 디버깅 가능하게 한다.
- user_menu_interactions를 모임 추천에 반영할지 검토하고, like/bookmark/pick/dislike를 보조 신호로 사용할 수 있게 한다.

3. 프론트/이미지 처리
- 개인 추천 화면에서 보낸 recentDuplicateDays와 includeNewMenu가 실제 결과에 반영되는지 테스트한다.
- 현재 Storage에는 ui-assets/menus/{menuId}.png가 없으므로, 추천 카드 이미지는 우선 categoryName 기반 카테고리 이미지로 fallback 처리한다.

4. 테스트
- 개인 추천 테스트에 recentDuplicateDays 반영 여부, includeNewMenu false 동작, 메뉴/태그 선호도 반영 케이스를 추가한다.
- 모임 추천 테스트에 totalScore <= 100 보장, 태그 수 bias 방지, 목적 적합도/참여자 선호도 균형 케이스를 추가한다.
```
