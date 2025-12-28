# 정책자금 AI 비서 백엔드 (Vercel)

## 엔드포인트
- POST /api/chat
  - body: { "message": "..." }
  - return: { ok: true, answer: "..." }

- POST /api/blog
  - body: { "topic": "...", "keywords": ["..."], "tone": "...", "length": "..." }
  - return: { ok: true, content: "..." }

## 환경변수 (Vercel)
- OPENAI_API_KEY
- OPENAI_MODEL (옵션)

## 로컬 실행
```bash
npm install
npm start
