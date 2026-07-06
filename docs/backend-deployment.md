# 백엔드 배포 가이드

## 배포 구조

현재 프로젝트는 프론트엔드와 백엔드를 분리해서 배포한다.

| 영역 | 추천 배포 위치 |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database/Auth | Supabase |

`vercel.json`은 프론트엔드 배포만 설정되어 있으므로 Express 백엔드는 Render 같은 Node 서버 배포 플랫폼에 별도로 올린다.

## 1. 배포 전 준비

백엔드는 TypeScript를 JavaScript로 빌드한 뒤 `node dist/server.js`로 실행한다.

```bash
npm --prefix backend install
npm --prefix backend run build
npm --prefix backend run start
```

로컬에서 실행 확인은 아래 주소로 한다.

```text
http://localhost:3000/health
```

## 2. Supabase 준비

실제 Supabase 프로젝트에 DB schema와 seed가 적용되어 있어야 한다.

필요한 값:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 secret이므로 프론트엔드 환경변수에 넣지 않는다.

## 3. Render에서 배포하기

### 방법 A: render.yaml 사용

1. Render에 로그인한다.
2. New > Blueprint를 선택한다.
3. GitHub 저장소 `madcamp-official/26s-w1-c3-01`를 연결한다.
4. 브랜치는 배포할 브랜치를 선택한다. 현재 기준으로는 `dev`를 사용한다.
5. Render가 루트의 `render.yaml`을 읽어 `mukpick-backend` web service를 만든다.
6. Environment Variables에 아래 값을 입력한다.

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### 방법 B: 수동 설정

Render에서 New > Web Service를 선택하고 아래처럼 설정한다.

| 항목 | 값 |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| Health Check Path | `/health` |

환경변수:

```text
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Render는 `PORT`를 자동으로 주입하므로 별도로 고정하지 않아도 된다.

## 4. 백엔드 배포 확인

배포가 끝나면 Render에서 제공한 URL 뒤에 `/health`를 붙여 확인한다.

```text
https://your-backend.onrender.com/health
```

정상 응답 예시:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## 5. 프론트엔드 환경변수 연결

프론트엔드 배포 환경에는 실제 백엔드 주소를 넣어야 한다.

```text
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

이 값을 설정하지 않으면 프론트는 기본값 `/api/v1`을 사용한다. 프론트와 백엔드가 같은 도메인에 있지 않으면 API 요청이 프론트 서버로 가서 JSON 파싱 오류가 날 수 있다.

## 6. 배포 후 점검 순서

| 순서 | 확인 항목 | 확인 방법 |
|---|---|---|
| 1 | 백엔드 서버 상태 | `GET /health` |
| 2 | Supabase 연결 | 회원가입 또는 로그인 API 호출 |
| 3 | Master Data 조회 | 로그인 후 `/api/v1/menus` 호출 |
| 4 | 프론트 연결 | Vercel 환경변수 `VITE_API_BASE_URL` 설정 후 재배포 |
| 5 | 주요 플로우 | 회원가입, 선호도 저장, 개인 추천, 모임 생성, 모임 추천 |

## 7. 주의 사항

- Render 무료 플랜은 일정 시간 요청이 없으면 서버가 sleep 상태가 될 수 있다.
- 첫 요청은 cold start 때문에 느릴 수 있다.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하면 안 된다.
- CORS는 현재 전체 허용 상태이므로 서비스 공개 전 허용 origin 제한을 검토한다.
