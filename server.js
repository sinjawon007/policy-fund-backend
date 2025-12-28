const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

if (!OPENAI_API_KEY) {
  console.warn("[WARN] OPENAI_API_KEY is not set.");
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버 (OpenAI)",
    endpoints: ["POST /api/chat", "POST /api/blog"],
  });
});

// (선택) GET으로 들어오면 안내만
app.get("/api/chat", (req, res) => {
  res.status(405).json({ error: "Use POST /api/chat with JSON { message }" });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set on server" });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required (string)" });
    }

    // ✅ OpenAI Responses API: input은 문자열로 보내면 됨 (type:'text' 쓰면 400남)
    const r = await client.responses.create({
      model: OPENAI_MODEL,
      input: message,
      // 필요하면 톤/가이드 추가 가능
      instructions:
        "너는 한국 정책자금 상담 보조 AI다. 과장하지 말고, 확인이 필요한 부분은 '공고 확인 필요'라고 명확히 말해라. 답변은 한국어로 간결하게.",
    });

    const answer = r.output_text || "";
    return res.json({ ok: true, answer });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: e?.message || "Server error",
    });
  }
});

app.post("/api/blog", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set on server" });
    }

    const { topic, keywords, tone, length } = req.body || {};
    const safeTopic = (topic || "").toString().trim();

    if (!safeTopic) {
      return res.status(400).json({ error: "topic is required" });
    }

    const kw = Array.isArray(keywords) ? keywords.join(", ") : (keywords || "");
    const t = (tone || "친근하고 신뢰감 있게").toString();
    const len = (length || "1200~1800자").toString();

    const prompt = `
아래 조건으로 네이버 블로그 글을 작성해줘.

- 주제: ${safeTopic}
- 키워드(자연스럽게 포함): ${kw}
- 톤: ${t}
- 분량: ${len}
- 구성: 문제제기 → 정보제공 → 경험결합 → CTA(관심유도→행동유도→직접문의유도)
- 주의: 허위/과장 금지, 정확한 정보는 공고 확인 안내 포함
- 출력: 제목 3개 + 본문 1개(소제목 포함) + 해시태그 10개
`.trim();

    const r = await client.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
    });

    return res.json({ ok: true, content: r.output_text || "" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// Vercel/로컬 모두 대응
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}
module.exports = app;
