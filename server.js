const express = require('express');
const cors = require('cors');
// node-fetch 삭제 (내장 fetch 사용)

const app = express();

// CORS 설정
app.use(cors({
    origin: '*', // 모든 곳에서 허용
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 1. 기본 경로 테스트
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '정책자금 AI 서버가 정상 작동 중입니다!' });
});

// 2. 채팅 API
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
        }

        // Node.js 18+ 내장 fetch 사용
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // 또는 gpt-3.5-turbo
                messages: [
                    { role: "system", content: "당신은 정책자금 전문가입니다. 한국어로 답변해주세요." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenAI Error:', data);
            return res.status(500).json({ error: data.error?.message || "OpenAI 오류" });
        }

        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. 블로그 API
app.post('/api/blog', async (req, res) => {
    try {
        const { topic } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "블로그 전문 작가입니다." },
                    { role: "user", content: `주제: ${topic}에 대한 블로그 글을 써줘.` }
                ]
            })
        });

        const data = await response.json();
        res.json({ blog: data.choices[0].message.content });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vercel용 내보내기
module.exports = app;
