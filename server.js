const express = require('express');
const cors = require('cors');

// ✅ OpenAI 공식 SDK (package.json에 openai가 있어야 합니다)
const OpenAI = require('openai');

const app = express();

// --------------------
// 기본 설정
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// 환경변수
// --------------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

// Vercel에서 설정한 키가 없으면 여기서 바로 에러 처리
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing. Set it in Vercel Environment Variables.');
}

// OpenAI 클라이언트
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// --------------------
// 헬스 체크
// --------------------
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '정책자금 AI 비서 백엔드 서버 (OpenAI)',
    endpoints: [
      'POST /api/chat - AI 채팅',
      'POST /api/blog - AI 블로그 작성'
    ]
  });
});

// --------------------
// /api/chat
// --------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지를 입력해주세요.' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: '서버에 OPENAI_API_KEY가 설정되지 않았습니다. (Vercel 환경변수 확인)'
      });
    }

    const systemPrompt = `
당신은 '정책자금 AI 비서'입니다.
- 한국어로 친절하고 실무적으로 답변합니다.
- 모르면 모른다고 말하고, 공고/기관 확인을 권합니다.
- 지나친 확답은 피하고, 체크리스트/절차/주의사항을 제시합니다.
- 답변 마지막에 짧게 "⚠️ 정확한 정보는 공고를 꼭 확인하세요"를 붙입니다.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt.trim() },
        { role: 'user', content: message }
      ],
      temperature: 0.5
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || '';

    return res.json({ reply });
  } catch (err) {
    console.error('❌ /api/chat error:', err?.message || err);
    return res.status(500).json({
      error: 'AI 호출 중 오류가 발생했습니다.',
      detail: err?.message || String(err)
    });
  }
});

// --------------------
// /api/blog
// --------------------
app.post('/api/blog', async (req, res) => {
  try {
    const { title, content, style } = req.body;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: '서버에 OPENAI_API_KEY가 설정되지 않았습니다. (Vercel 환경변수 확인)'
      });
    }

    const finalTitle = (title || '정책자금 안내').toString();
    const finalContent = (content || '정책자금에 대해 쉽게 설명하고, 신청 시 주의사항과 체크리스트를 포함해줘.').toString();
    const finalStyle = (style || '문제제기 → 정보제공 → 경험결합 → CTA 구조, 3단계 CTA(관심→행동→문의), 자연스러운 키워드 배치').toString();

    const prompt = `
아래 정보를 바탕으로 네이버 블로그 글을 작성해줘.

[제목]
${finalTitle}

[요청 내용]
${finalContent}

[스타일]
${finalStyle}

[필수]
- 소제목/목차 구성
- 체크리스트 5~8개
- 마지막 CTA 3단계(관심유도→행동유도→직접문의유도)
- 과장 금지, 공고 확인 문구 포함
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 네이버 블로그 전문 카피라이터입니다. 한국어로 자연스럽고 SEO를 고려해 작성합니다.' },
        { role: 'user', content: prompt.trim() }
      ],
      temperature: 0.6
    });

    const blog = completion.choices?.[0]?.message?.content?.trim() || '';
    return res.json({ blog });
  } catch (err) {
    console.error('❌ /api/blog error:', err?.message || err);
    return res.status(500).json({
      error: '블로그 생성 중 오류가 발생했습니다.',
      detail: err?.message || String(err)
    });
  }
});

// --------------------
// 서버 실행 (Vercel에서는 보통 listen 없어도 되지만 로컬 테스트용으로 둠)
// --------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
