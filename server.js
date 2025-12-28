/**
 * policy-fund-backend (Express)
 * - GET  /            : health
 * - POST /api/chat     : chat (OpenAI Responses API)
 * - POST /api/blog     : blog writing (OpenAI Responses API)
 *
 * IMPORTANT
 * - /api/chat 은 POST 전용입니다. 브라우저 주소창은 GET이라 "Cannot GET"이 정상입니다.
 */

const express = require("express");
const cors = require("cors");

const app = express();

/** ====== ENV ====== */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini"; // 빠르고 저렴한 기본값
const OPENAI_REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || "medium"; // low|medium|high
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

/** ====== MIDDLEWARE ====== */
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

/** ====== HELPERS ====== */
function requireApiKey() {
  if (!OPENAI_API_KEY) {
    const err = new Error(
      "OPENAI_API_KEY 가 설정되지 않았습니다. (Vercel > Project > Settings > Environment Variables)"
    );
    err.statusCode = 500;
    throw err;
  }
}

async function callOpenAIResponses({ input, max_output_tokens = 800 }) {
  requireApiKey();

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: OPENAI_REASONING_EFFORT },
      input,
      max_output_tokens,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      `OpenAI API error (status ${res.status})`;
    const err = new Error(msg);
    err.statusCode = 500;
    err.detail = data;
    throw err;
  }

  // Responses API는 output_text에 최종 텍스트가 들어옵니다.
  const text = data.output_text || "";
  return { text, raw: data };
}

/** ====== ROUTES ====== */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버 (OpenAI)",
    endpoints: ["POST /api/chat", "POST /api/blog"],
  });
});

// (옵션) GET으로 들어오면 친절히 안내
app.get("/api/chat", (req, res) => {
  res.status(405).json({
    error: "Method Not Allowed",
    hint: "POST /api/chat 로 JSON { message: '...' } 를 보내야 합니다.",
  });
});

app.get("/api/blog", (req, res) => {
  res.status(405).json({
    error: "Method Not Allowed",
    hint: "POST /api/blog 로 JSON { topic/title/... } 를 보내야 합니다.",
  });
});

/**
 * POST /api/chat
 * body: { message: string }
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message 를 입력해주세요." });
    }

    const system = `
당신은 '정책자금 AI 비서'입니다.
- 한국어로 친절하고 실무적으로 답합니다.
- 확정적 단정 대신, 조건/예외/필요서류/확인경로를 함께 안내합니다.
- 마지막에 항상: "⚠️ 정확한 정보는 공고/기관 안내를 꼭 확인하세요." 문구를 포함합니다.
`;

    const { text } = await callOpenAIResponses({
      input: [
        { role: "system", content: system.trim() },
        { role: "user", content: message.trim() },
      ],
      max_output_tokens: 900,
    });

    res.json({
      ok: true,
      reply: text,
      model: OPENAI_MODEL,
    });
  } catch (e) {
    console.error(e);
    res.status(e.statusCode || 500).json({
      ok: false,
      error: e.message || "Server error",
      detail: e.detail || undefined,
    });
  }
});

/**
 * POST /api/blog
 * body: {
 *   title?: string,
 *   topic?: string,
 *   keywords?: string[] | string,
 *   audience?: string,
 *   tone?: string
 * }
 */
app.post("/api/blog", async (req, res) => {
  try {
    const {
      title = "",
      topic = "",
      keywords = [],
      audience = "소상공인/자영업자",
      tone = "친근하고 전문가 느낌",
    } = req.body || {};

    const kw =
      Array.isArray(keywords) ? keywords.join(", ") : String(keywords || "");

    const prompt = `
아래 조건으로 네이버 블로그용 글을 작성해줘.

- 제목: ${title || "(네가 추천 제목도 3개 제안)"}
- 주제: ${topic || "정책자금/정부지원금"}
- 대상: ${audience}
- 톤: ${tone}
- 키워드(자연스럽게 분산 배치): ${kw || "(네가 적절히 선정)"}

구성:
1) 문제제기(후킹)
2) 정보제공(핵심 포인트 5~7개)
3) 경험/사례 느낌의 설명(현실적인 상황)
4) CTA 3단계(관심유도 → 행동유도 → 직접문의유도)
5) 마지막에 주의문구: "⚠️ 정확한 정보는 공고/기관 안내를 꼭 확인하세요."

분량: 1,200~1,800자 정도
`;

    const { text } = await callOpenAIResponses({
      input: [{ role: "user", content: prompt.trim() }],
      max_output_tokens: 1400,
    });

    res.json({
      ok: true,
      blog: text,
      model: OPENAI_MODEL,
    });
  } catch (e) {
    console.error(e);
    res.status(e.statusCode || 500).json({
      ok: false,
      error: e.message || "Server error",
      detail: e.detail || undefined,
    });
  }
});

/** ====== LISTEN (local only) ====== */
const PORT = process.env.PORT || 3000;

// Vercel에서는 보통 listen이 필요 없거나, 환경에 따라 다를 수 있어 조건부 처리
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// Vercel/Serverless 호환을 위해 export
module.exports = app;
