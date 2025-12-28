# 카페24 Node.js 호스팅 배포 가이드

## 📋 준비사항

1. **Claude API 키 발급**
   - https://console.anthropic.com 접속
   - 계정 생성/로그인
   - API Keys 메뉴에서 새 키 생성
   - 생성된 키 복사 (sk-ant-로 시작)

2. **카페24 Node.js 호스팅 접속 정보**
   - FTP/SSH 접속 정보
   - 호스팅 경로

---

## 🚀 카페24 배포 방법

### 방법 1: FTP 업로드 (간단)

#### 1단계: 파일 압축
모든 파일을 ZIP으로 압축:
- server.js
- package.json
- .env.example

#### 2단계: FTP 업로드
1. FTP 클라이언트 (FileZilla 등) 접속
2. 카페24 호스팅 경로로 이동
3. 압축 파일 업로드 & 압축 해제

#### 3단계: 카페24 관리자에서 설정
1. 카페24 관리자 페이지 접속
2. Node.js 호스팅 메뉴
3. 환경변수 설정:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```
4. npm install 실행
5. 서버 시작

---

### 방법 2: SSH 직접 배포 (전문가용)

#### 1단계: SSH 접속
```bash
ssh your-username@your-cafe24-host.com
```

#### 2단계: 파일 업로드
```bash
# 로컬에서 실행
scp -r * your-username@your-cafe24-host.com:/home/your-path/
```

#### 3단계: 서버에서 설치
```bash
# SSH 접속 후
cd /home/your-path/
npm install
```

#### 4단계: 환경변수 설정
```bash
# .env 파일 생성
nano .env

# 내용 입력:
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
PORT=3000
```

#### 5단계: 서버 시작
```bash
npm start
```

---

## 🔗 아임웹 코드 수정

### 1단계: 서버 URL 확인
카페24에서 제공하는 서버 URL 확인 예:
```
https://your-domain.cafe24.com
```

### 2단계: 아임웹 코드 수정

**AI 채팅 부분 (기존):**
```javascript
// 기존 코드 (삭제)
const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    // ...
});
```

**새 코드 (변경):**
```javascript
// 카페24 서버로 요청
const response = await fetch("https://your-domain.cafe24.com/api/chat", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        message: userMessage
    })
});

const data = await response.json();
const aiMessage = data.message;
const disclaimer = data.disclaimer;
```

**AI 블로그 도우미 부분:**
```javascript
// 카페24 서버로 요청
const response = await fetch("https://your-domain.cafe24.com/api/blog", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        topic: topic
    })
});

const data = await response.json();
document.getElementById('blogTitle').value = data.title;
document.getElementById('blogContent').value = data.content;
```

---

## ✅ 테스트 방법

### 1. 로컬 테스트 (배포 전)
```bash
# 패키지 설치
npm install

# .env 파일 만들기
cp .env.example .env
# .env 파일을 열어서 실제 API 키 입력

# 서버 실행
npm start
```

브라우저에서 확인:
- http://localhost:3000 → 서버 상태 확인
- Postman으로 API 테스트

### 2. 카페24 테스트 (배포 후)
```bash
# curl로 테스트
curl -X POST https://your-domain.cafe24.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"정책자금이 뭔가요?"}'
```

---

## 🔐 보안 주의사항

1. **API 키 절대 노출 금지**
   - .env 파일 git에 올리지 말 것
   - 코드에 직접 입력하지 말 것

2. **CORS 설정**
   - 운영 환경에서는 특정 도메인만 허용
   - server.js의 cors() 부분 수정:
   ```javascript
   app.use(cors({
     origin: 'https://your-imweb-domain.com'
   }));
   ```

3. **Rate Limiting 추가** (선택)
   - 과도한 요청 방지
   - express-rate-limit 패키지 사용

---

## 📞 문제 해결

### 서버가 시작 안 됨
- Node.js 버전 확인 (14 이상)
- package.json 확인
- npm install 다시 실행

### API 키 에러
- ANTHROPIC_API_KEY 환경변수 확인
- API 키 유효성 확인
- 요금 충전 확인

### CORS 에러
- server.js의 cors 설정 확인
- 브라우저 개발자 도구에서 에러 확인

---

## 💰 비용 관리

### Claude API 비용
- 사용량 기반 과금
- console.anthropic.com에서 사용량 모니터링
- 월 예산 설정 권장

### 카페24 호스팅
- 내년 11월까지 사용 가능
- 트래픽 확인

---

## 📊 모니터링

### 로그 확인
```bash
# 카페24 SSH에서
tail -f logs/server.log
```

### 사용량 확인
- Claude API: https://console.anthropic.com
- 카페24: 관리자 페이지

---

## 🔄 업데이트 방법

1. 코드 수정
2. FTP로 파일 재업로드
3. 서버 재시작 (카페24 관리자에서)

---

## 📞 지원

문제 발생 시:
1. 로그 확인
2. 환경변수 확인
3. API 키 확인
4. 카페24 고객센터 문의

---

**배포 완료 후 꼭 테스트하세요!** ✅
