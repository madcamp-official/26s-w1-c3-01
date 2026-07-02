# 26s-w1-c3-01

## 공통과제 I : 웹 기반 프로젝트 (2인 1팀)

**목적:** 공통 과제를 함께 수행하며 웹 개발의 전체 흐름을 빠르게 익히고 협업에 적응하기

**결과물:** 기획부터 배포까지 완료된 웹 서비스와 관련 문서 일체

---

## 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
| 손기환 | Kihwan819 | 공동 기획 및 개발 |
| 박지호 | batiger00 | 공동 기획 및 개발 |

---

## 기획안

- **프로젝트 주제:** 메뉴 결정 앱
- **목적:** 많은 사람들이 약속이 생겼을 때 메뉴 결정을 위해 쓰는 시간을 줄이고, 의견 갈등을 완화하는 것
- **핵심 기능:**
  - 랜덤 추천이 아닌 개인의 성향과 집단의 선호도에 따라 메뉴를 결정해주는 프로그램
  - 유저들의 식단 분석 및 개인의 선호도 분석
  - 집단 약속에서의 알맞은 메뉴 추천
  - 변칙적인 새로운 식사에 대한 시도 제안
- **예상 사용자:**
  - 대학생 (집단, 개인)
  - 재택 근무자 (개인)
- **팀원별 역할:**
  - 손기환: 공동 기획 및 개발
  - 박지호: 공동 기획 및 개발

---

## 기능 명세서

구현해야 할 기능은 사용자가 개인 또는 집단 식사 상황에서 메뉴를 효율적으로 결정할 수 있도록 지원하는 기능으로 구성한다.

### 필수 기능

- 적절한 메뉴에 대한 랭킹 제공: 추천 시스템 기반 메뉴 순위화
- 다수의 정보 취합 후 메뉴 선정: 음식에 대한 취향과 알러지 정보 반영
- 식사 시기에 따른 메뉴 추천

### 선택 기능

- 추천 메뉴에 맞는 주변 식당 정보 제공
- 날짜와 시간에 대한 메뉴 선호도 반영
- 개인 식단 목표 기반 추천: 다이어트, 웰니스 등

---

## IA 및 화면 설계서

> 서비스의 전체 페이지 구조와 페이지 간 이동 흐름; 각 페이지의 주요 UI 구성, 입력 요소, 버튼, 사용자 행동 흐름 등을 간단한 와이어프레임 형태로 정리

<!-- Figma 링크 또는 이미지 첨부 -->

---

## DB 스키마

> 필요한 테이블, 주요 필드, 데이터 타입, 테이블 간 관계를 정리

<!-- ERD 이미지 또는 테이블 정의 -->

---

## API 문서

> API 주소, 요청 방식, 요청값, 응답값, 에러 상황을 정리

| Method | Endpoint | 설명 | 요청 | 응답 |
|---|---|---|---|---|
|  |  |  |  |  |

---

## 배포 결과물

> 접속 가능한 링크, 실행 방법, 주요 구현 내용

- **서비스 URL:**
- **실행 방법:**

```bash
# 실행 방법 작성
```

---

## 회고 문서

> 개발 과정에서의 어려움, 해결 방법, 역할 분담, 다음에 개선할 점 (KPT 방법론 참고)

### Keep

### Problem

### Try

---

## 참고 자료

- [SDD(스펙 주도 개발) 이해하기](https://news.hada.io/topic?id=21338)
- [Software Design Document Best Practices](https://www.atlassian.com/work-management/project-management/design-document)
- [IA 정보구조도 작성 방법](https://brunch.co.kr/@nyonyo/7)
- [기획자 화면설계서 작성법](https://brunch.co.kr/@soup/10)
- [Figma 와이어프레임 가이드](https://www.figma.com/ko-kr/resource-library/what-is-wireframing/)
- [무료 Figma 와이어프레임 키트](https://www.figma.com/ko-kr/templates/wireframe-kits/)
- [ERD/DB 설계 총정리](https://inpa.tistory.com/entry/DB-%F0%9F%93%9A-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%AA%A8%EB%8D%B8%EB%A7%81-%EA%B0%9C%EB%85%90-ERD-%EB%8B%A4%EC%9D%B4%EC%96%B4%EA%B7%B8%EB%9E%A8)
- [API 명세서 작성 가이드라인](https://velog.io/@sebinChu/BackEnd-API-%EB%AA%85%EC%84%B8%EC%84%9C-%EC%9E%91%EC%84%B1-%EA%B0%80%EC%9D%B4%EB%93%9C-%EB%9D%BC%EC%9D%B8)
- [좋은 README 작성하는 방법](https://velog.io/@sabo/good-readme)
- [단기 프로젝트 회고 KPT 방법론](https://velog.io/@habwa/%EB%8B%A8%EA%B8%B0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-KPT-%EB%B0%A9%EB%B2%95%EB%A1%A0)
