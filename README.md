# 정책자금 AI 비서 백엔드 서버

Node.js Express 기반 백엔드 서버로, Claude API를 안전하게 호출합니다.

## 🎯 주요 기능

- **AI 채팅**: 정책자금 관련 질문 답변
- **AI 블로그 작성**: 블로그 콘텐츠 자동 생성
- **API 키 보안**: 프론트엔드에서 API 키 노출 방지
- **CORS 지원**: 아임웹에서 호출 가능

## 📁 파일 구조

```
.
├── server.js           # 메인 서버 파일
├── package.json        # 프로젝트 설정
├── .env.example        # 환경변수 예시
├── .gitignore         # Git 제외 파일
├── CAFE24_DEPLOY.md   # 카페24 배포 가이드
└── README.md          # 이 파일
```

## 🚀 빠른 시작

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열어서 API 키 입력:
```
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
PORT=3000
```

### 3. 서버 실행
```bash
npm start
```

### 4. 테스트
브라우저에서 접속:
```
http://localhost:3000
```

## 📡 API 엔드포인트

### 1. 서버 상태 확인
```
GET /
```

응답:
```json
{
  "status": "ok",
  "message": "정책자금 AI 비서 백엔드 서버",
  "endpoints": [...]
}
```

### 2. AI 채팅
```
POST /api/chat
```

요청:
```json
{
  "message": "정책자금이 뭔가요?"
}
```

응답:
```json
{
  "success": true,
  "message": "AI 답변 내용...",
  "disclaimer": "⚠️ 정확한 정보는 공고를 꼭 확인하세요"
}
```

### 3. AI 블로그 작성
```
POST /api/blog
```

요청:
```json
{
  "topic": "제조업 설비자금"
}
```

응답:
```json
{
  "success": true,
  "title": "블로그 제목",
  "content": "블로그 본문 내용..."
}
```

## 🔗 아임웹 연동

### JavaScript 코드 예시

```javascript
// AI 채팅
async function getAIResponse(message) {
  const response = await fetch('https://your-server.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  const data = await response.json();
  return data.message;
}

// AI 블로그
async function generateBlog(topic) {
  const response = await fetch('https://your-server.com/api/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic })
  });
  
  const data = await response.json();
  return { title: data.title, content: data.content };
}
```

## 📦 카페24 배포

자세한 배포 방법은 `CAFE24_DEPLOY.md` 참고

간단 요약:
1. 파일 업로드
2. npm install
3. 환경변수 설정
4. 서버 시작

## 🔒 보안

- ✅ API 키는 환경변수로 관리
- ✅ .env 파일은 git에 올리지 않음
- ✅ CORS 설정 필요
- ⚠️ 운영 시 특정 도메인만 허용 권장

## 💰 비용

- **카페24**: 내년 11월까지 무료
- **Claude API**: 사용량 기반 과금
  - 입력: $3 / 1M tokens
  - 출력: $15 / 1M tokens
  - 예상 비용: 월 $10-50 (트래픽에 따라)

## 🛠️ 개발

### 로컬 개발
```bash
npm run dev  # nodemon으로 자동 재시작
```

### 로그 확인
콘솔에서 실시간 로그 확인 가능

## 📞 문제 해결

### 서버 시작 안 됨
- Node.js 버전 확인 (14 이상)
- npm install 다시 실행

### API 에러
- API 키 확인
- 요금 충전 확인
- 로그 확인

### CORS 에러
- 브라우저 개발자 도구 확인
- server.js의 cors 설정 확인

## 📈 업데이트 로그

- v1.0.0 (2025-12-28)
  - 초기 버전
  - AI 채팅, AI 블로그 기능

## 📄 라이선스

ISC

---

**Made with ❤️ for 정책자금 AI 비서**
