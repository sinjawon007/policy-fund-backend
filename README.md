# 정책자금 AI 비서 백엔드 (OpenAI)

Express 기반 백엔드 서버입니다.

## 엔드포인트
- `GET /` : 서버 상태
- `POST /api/chat` : AI 채팅
- `POST /api/blog` : AI 블로그 작성

> `GET /api/chat` 로 브라우저에서 접속하면 `Cannot GET` 또는 405가 정상입니다.  
> 반드시 POST로 호출해야 합니다.

## 환경변수 (Vercel)
- `OPENAI_API_KEY` (필수)
- `OPENAI_MODEL` (기본: gpt-5-mini)
- `OPENAI_REASONING_EFFORT` (low|medium|high)
- `FRONTEND_ORIGIN` (CORS 허용 도메인)

## 로컬 실행
```bash
npm install
OPENAI_API_KEY=... npm start
