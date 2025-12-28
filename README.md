# 정책자금 AI 비서 백엔드 (OpenAI)

## 엔드포인트
- GET  / : 상태 확인
- POST /api/chat : 정책자금 Q&A
- POST /api/blog : 블로그 글 생성

## 환경변수 (Vercel)
- OPENAI_API_KEY (필수)
- OPENAI_MODEL (기본 gpt-5.2)
- ALLOWED_ORIGINS (선택, CORS 허용 도메인들)

## 로컬 실행
```bash
npm i
# env 설정 후
npm run dev
