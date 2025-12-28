# 정책자금 AI 비서 백엔드 (OpenAI)

Node.js Express 기반 백엔드 서버로, OpenAI API를 안전하게 호출합니다.
(프론트엔드에 API Key가 노출되지 않도록 서버에서만 호출)

## ✅ 엔드포인트
- GET `/` : 서버 상태 확인
- POST `/api/chat` : 정책자금 AI 채팅
- POST `/api/blog` : 정책자금 블로그 글 생성

## ✅ Vercel 환경변수 설정
Vercel → Project → Settings → Environment Variables 에 아래를 추가하세요.

- `OPENAI_API_KEY` = (본인 키)
- `OPENAI_MODEL` = gpt-4o-mini (권장, 선택)

저장 후 **Redeploy** 해야 반영됩니다.

## ✅ 로컬 실행
```bash
npm install
cp env.example .env
# .env에 OPENAI_API_KEY 입력
npm start
