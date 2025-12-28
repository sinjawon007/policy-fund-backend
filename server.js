const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // HTTP 요청을 위해 필요
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 기본 경로 테스트 (서버 작동 확인용)
app.get('/', (req, res) => {
    res.send('정책자금 AI 비서 서버 (ChatGPT 버전) 정상 작동 중!');
});

// 1. AI 채팅 엔드포인트 (OpenAI GPT-4o)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        // API 키 확인
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
        }

        // OpenAI API 호출
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // 최신 모델 사용 (비용 절약 시 "gpt-3.5-turbo"로 변경 가능)
                messages: [
                    {
                        role: "system",
                        content: "당신은 한국의 정부 정책자금 전문 컨설턴트입니다. 소상공인과 중소기업 대표님들에게 친절하고 명확하게 조언해주세요."
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        // 에러 처리
        if (!response.ok) {
            console.error('OpenAI Error:', data);
            throw new Error(data.error?.message || 'OpenAI API 호출 실패');
        }

        // 답변 추출
        const botReply = data.choices[0].message.content;
        res.json({ message: botReply });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            message: '죄송합니다. 오류가 발생했습니다.',
            error: error.message 
        });
    }
});

// 2. AI 블로그 작성 엔드포인트 (OpenAI GPT-4o)
app.post('/api/blog', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "당신은 정책자금 전문 블로그 작가입니다. SEO에 최적화된 전문적인 글을 작성해주세요."
                    },
                    { role: "user", content: `주제: ${topic}에 대해 전문적인 블로그 포스팅을 작성해줘.` }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        res.json({ content: content });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
