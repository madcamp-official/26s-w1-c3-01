# MUKPICK 추천 알고리즘 요약

분석 기준: `personal-simple-v2`, `meeting-group-v2`

---

## 코드 위치

| 영역 | 핵심 파일 |
|---|---|
| 개인 추천 API | `backend/src/modules/recommendations/*` |
| 모임 추천 API | `backend/src/modules/meeting-recommendations/*` |
| 선호도 저장 | `backend/src/modules/preferences/*`, `backend/src/modules/user-preferences/*` |
| 추천용 DB view | `supabase/migrations/20260707153000_update_recommendation_inputs.sql` |
| 프론트 추천 표시 | `frontend/src/features/recommendations/*`, `frontend/src/domain/appModel.ts` |

---

## 공통 입력 데이터

추천 계산은 정규화된 메뉴/태그/알러지 테이블을 직접 수정하지 않고, `menu_recommendation_features` view를 통해 메뉴별 계산 feature를 읽는다.

```text
menu_id
category_id
category_name
name
price_level
tag_ids
allergy_ids
```

선호도 점수는 모든 선호도 테이블에서 `0~5` 정수로 저장한다.

```text
0 = 명시적 비선호
5 = 매우 선호
```

---

## 개인 추천: personal-simple-v2

개인 추천은 사용자 1명의 선호도, 예산, 식사 기록을 기준으로 모든 메뉴를 점수화한다.

### 후보 제외

```text
1. 사용자 알러지와 메뉴 알러지가 충돌하면 제외
2. includeNewMenu=false이고 meal_history에 없는 메뉴면 제외
```

### 점수식

```text
personalScore = categoryScore
              + tagScore
              + menuPreferenceScore
              + budgetScore
              + newMenuScore
              - historyPenalty

finalScore = clamp(personalScore, 0, 100)
```

| 점수 | 범위 | 계산 |
|---|---:|---|
| `category_score` | 0~30 | `user_category_preferences.preference_score / 5 * 30` |
| `tag_score` | 0~20 | 메뉴 태그들의 사용자 태그 선호도 평균 `/ 5 * 20` |
| `menu_preference_score` | 0~25 | 메뉴 직접 선호도, 없으면 식사 기록 rating 평균, 없으면 기본 5점 |
| `budget_score` | 5/8/10 | 예산 초과 5, 예산 미만 8, 범위 내부 또는 미설정 10 |
| `new_menu_score` | 0/15 | `meal_history`에 없는 메뉴면 15 |
| `history_penalty` | 0~20 | `recentDuplicateDays` 기준 최근 식사 선형 감점 |

### 정렬

```text
1. totalScore desc
2. historyPenalty asc
3. newMenuScore desc
4. menuPreferenceScore desc
5. categoryScore desc
6. tagScore desc
7. budgetScore desc
8. menuName ko asc
9. menuId asc
```

결과는 `personal_recommendation_runs`, `personal_recommendation_results`에 저장한다.

---

## 모임 추천: meeting-group-v2

모임 추천은 개인 추천 Top N 결과를 재사용하지 않는다. 모든 메뉴에 대해 참여자별 점수를 다시 계산한 뒤 평균을 내고, 모임 목적 점수를 더한다.

### 후보 제외

```text
1. 참여자 중 한 명이라도 메뉴 알러지와 충돌하면 제외
2. 참여자 중 한 명이라도 해당 카테고리를 명시적으로 0점 저장했으면 제외
3. 참여자 중 한 명이라도 해당 메뉴를 명시적으로 0점 저장했으면 제외
```

`row 없음`은 미입력/중립이며, `preference_score = 0`과 다르게 취급한다.

### 점수식

```text
participantRawScore = categoryScore + tagScore + menuPreferenceScore + budgetScore
participantPreferenceScore = participantRawScore / 85 * 80
groupPreferenceScore = average(participantPreferenceScore)
purposeScore = menu_purpose_suitability.suitability_score / 5 * 20
meetingScore = clamp(groupPreferenceScore + purposeScore, 0, 100)
```

모임 추천에서는 개인 추천의 `newMenuScore`, `historyPenalty`를 사용하지 않는다.

### 정렬

```text
1. meetingScore desc
2. minimumParticipantScore desc
3. purposeScore desc
4. groupPreferenceScore desc
5. menuName ko asc
6. menuId asc
```

결과는 `recommendation_runs`, `meeting_recommendations`에 저장하고 모임 상태를 `RECOMMENDED`로 바꾼다.

---

## 프론트 표시

프론트 추천 카드에는 개인 추천 breakdown을 다음 기준으로 표시한다.

```text
카테고리
태그
메뉴 선호
예산
새 메뉴
최근 패널티
```

추천 결과 조회 직후 자동 `view` interaction 저장은 사용하지 않는다. 좋아요, 싫어요, 저장 같은 명시적 사용자 action만 interaction API로 기록한다.
