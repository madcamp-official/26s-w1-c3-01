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
PUBLIC_SITE_URL
AUTH_EMAIL_REDIRECT_URL
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 secret이므로 프론트엔드 환경변수에 넣지 않는다.

이메일 인증을 운영 도메인에서 사용하려면 아래처럼 설정한다.

```text
PUBLIC_SITE_URL=https://mukpick.help
AUTH_EMAIL_REDIRECT_URL=https://mukpick.help
```

### Supabase Auth + Resend 설정

`mukpick.help` 도메인 메일 발송은 코드만으로 끝나지 않고 DNS와 Supabase 대시보드 설정이 필요하다.

1. Resend에서 `mukpick.help` 도메인을 추가한다.
2. 도메인 구매처 DNS에 Resend가 안내하는 `TXT`, `MX`, `CNAME` 레코드를 추가한다.
3. Resend에서 도메인이 Verified 상태인지 확인한다.
4. Supabase Dashboard > Authentication > SMTP Settings에서 Custom SMTP를 켠다.
5. Resend SMTP 값을 입력한다.

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: Resend API key
Sender email: no-reply@mukpick.help
Sender name: MUK PICK
```

6. Supabase Dashboard > Authentication > URL Configuration에서 설정한다.

```text
Site URL: https://mukpick.help
Redirect URLs: https://mukpick.help
```

로컬 테스트를 같이 할 때는 Redirect URLs에 `http://localhost:5173`도 추가한다.

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
PUBLIC_SITE_URL
AUTH_EMAIL_REDIRECT_URL
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
PUBLIC_SITE_URL=https://mukpick.help
AUTH_EMAIL_REDIRECT_URL=https://mukpick.help
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
| 3 | 이메일 인증 | 회원가입 후 `no-reply@mukpick.help` 발신 인증 메일 수신 및 링크 클릭 |
| 4 | 프론트 연결 | Vercel 환경변수 `VITE_API_BASE_URL` 설정 후 재배포 |
| 5 | Master Data 조회 | 로그인 후 `/api/v1/menus` 호출 |
| 6 | 주요 플로우 | 회원가입, 선호도 저장, 개인 추천, 모임 생성, 모임 추천 |

## 7. 주의 사항

- Render 무료 플랜은 일정 시간 요청이 없으면 서버가 sleep 상태가 될 수 있다.
- 첫 요청은 cold start 때문에 느릴 수 있다.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하면 안 된다.
- CORS는 현재 전체 허용 상태이므로 서비스 공개 전 허용 origin 제한을 검토한다.
