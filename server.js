const express = require('express');
const cors = require('cors');
const app = express();

// 환경변수에서 API 키 가져오기
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors()); // 모든 도메인에서 접근 가능 (운영 시 특정 도메인으로 제한 필요)
app.use(express.json());

// 헬스 체크 엔드포인트
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '정책자금 AI 비서 백엔드 서버',
    endpoints: [
      'POST /api/chat - AI 채팅',
      'POST /api/blog - AI 블로그 작성'
    ]
  });
});

// AI 채팅 엔드포인트
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지를 입력해주세요' });
    }

    // open AI API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `당신은 정부 정책자금 전문 AI 상담사입니다. 다음 질문에 친절하고 정확하게 답변해주세요: ${message}`
          }
        ]
      })
    });

    const data = await response.json();

    // 에러 처리
    if (!response.ok) {
      console.error('Claude API Error:', data);
      return res.status(response.status).json({
        error: 'AI 응답 생성 중 오류가 발생했습니다',
        details: data
      });
    }

    // 텍스트 추출
    const aiMessage = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    res.json({
      success: true,
      message: aiMessage,
      disclaimer: '⚠️ 정확한 정보는 공고를 꼭 확인하세요'
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다',
      message: error.message
    });
  }
});

// AI 블로그 작성 도우미 엔드포인트
app.post('/api/blog', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: '주제를 입력해주세요' });
    }

    // Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `정책자금 관련 블로그 글을 작성해주세요. 주제: ${topic}\n\n다음 형식으로 작성해주세요:\n1. 흥미로운 제목\n2. 본문 (500자 이내, 정책자금 정보 중심)\n3. 실용적인 팁 포함`
          }
        ]
      })
    });

    const data = await response.json();

    // 에러 처리
    if (!response.ok) {
      console.error('Claude API Error:', data);
      return res.status(response.status).json({
        error: 'AI 응답 생성 중 오류가 발생했습니다',
        details: data
      });
    }

    // 텍스트 추출 및 제목/본문 분리
    const content = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    const lines = content.split('\n').filter(line => line.trim());
    const title = lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
    const body = lines.slice(1).join('\n').trim();

    res.json({
      success: true,
      title: title,
      content: body
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다',
      message: error.message
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`💡 API 테스트: http://localhost:${PORT}`);
});
