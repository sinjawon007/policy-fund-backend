const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Vercel 환경변수
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// 헬스체크
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버",
    endpoints: ["POST /api/chat - AI 채팅", "POST /api/blog - AI 블로그 작성"],
  });
});

// ✅ 공통: 키 체크
function assertKey(res) {
  if (!OPENAI_API_KEY) {
    res.status(500).json({
      error:
        "OPENAI_API_KEY가 설정되지 않았습니다. Vercel Environment Variables에 OPENAI_API_KEY를 넣고 Redeploy 하세요.",
    });
    return false;
  }
  return true;
}

// ✅ /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    if (!assertKey(res)) return;

    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message가 비어있습니다." });
    }

    const system = `
당신은 "정책자금 AI 비서"입니다.
- 소상공인/중소기업 정책자금 문의에 친절하고 실무적으로 답합니다.
- 확정적 단정은 피하고, 신청은 공고/기관 확인이 필요하다는 안내를 덧붙입니다.
- 답변은 한국어로, 너무 길지 않게 핵심 위주로 정리합니다.
`;

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "답변 생성에 실패했습니다.";

    res.json({
      reply,
      disclaimer: "⚠️ 정확한 정보는 반드시 해당 공고/기관 안내를 확인하세요.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "서버 오류",
      detail: err?.message || String(err),
    });
  }
});

// ✅ /api/blog
app.post("/api/blog", async (req, res) => {
  try {
    if (!assertKey(res)) return;

    const { title, topic, keywords } = req.body || {};
    const t = title || `${topic || "정책자금"} 안내`;
    const k = Array.isArray(keywords) ? keywords : [];

    const prompt = `
아래 조건으로 네이버 블로그용 글을 작성해줘.
- 제목: ${t}
- 주제: ${topic || "정책자금/정부지원금"}
- 포함 키워드: ${k.join(", ") || "정책자금, 정부지원금"}
- 구조: 문제제기 → 정보제공 → 경험결합(현장감/사례) → CTA(관심유도→행동유도→문의유도)
- 너무 과장 금지, 마지막에 공고 확인 안내 포함
- 길이: 1200~1800자 내외
`;

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "당신은 전문 블로그 카피라이터입니다." },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.7,
    });

    const content =
      completion.choices?.[0]?.message?.content?.trim() ||
      "글 생성에 실패했습니다.";

    res.json({
      title: t,
      content,
      disclaimer: "⚠️ 정확한 조건/일정은 공고 원문을 꼭 확인하세요.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "서버 오류",
      detail: err?.message || String(err),
    });
  }
});

// (로컬 실행용) — Vercel에서도 있어도 문제 없음
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

module.exports = app;
