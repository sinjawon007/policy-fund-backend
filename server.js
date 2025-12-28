// server.js
// Express API server for Vercel
// Endpoints:
//   GET  /        -> health
//   POST /api/chat -> policy Q&A
//   POST /api/blog -> blog draft

const express = require("express");
const cors = require("cors");

const app = express();

// ---------- env ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";
const PORT = process.env.PORT || 3000;

// Allowed origins (comma-separated). Example:
// ALLOWED_ORIGINS=https://sinjawon007.imweb.me,http://localhost:3000
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ---------- middleware ----------
app.use(express.json({ limit: "1mb" }));

app.use(
  cors({
    origin: function (origin, cb) {
      // allow non-browser tools (curl/postman) with no origin
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes("*")) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: false,
  })
);

// ---------- helpers ----------
function requireKey() {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      status: 500,
      body: {
        error:
          "OPENAI_API_KEY is missing. Set it in Vercel Project Settings → Environment Variables, then Redeploy.",
      },
    };
  }
  return { ok: true };
}

async function callOpenAIResponses({ input, temperature = 0.7 }) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input,
      temperature,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `OpenAI API error (HTTP ${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  // Try to extract text safely
  // Many responses include output_text convenience field on some SDKs,
  // but raw REST returns structured output. We'll extract common fields.
  let text = "";

  // Some responses may have: data.output[0].content[0].text
  if (Array.isArray(data.output) && data.output.length > 0) {
    const first = data.output[0];
    if (Array.isArray(first.content) && first.content.length > 0) {
      const c0 = first.content[0];
      text = c0?.text || c0?.value || "";
    }
  }

  // Fallbacks
  if (!text && typeof data.output_text === "string") text = data.output_text;
  if (!text && typeof data?.text === "string") text = data.text;

  return { raw: data, text: text || "" };
}

// ---------- routes ----------
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버 (OpenAI)",
    endpoints: ["POST /api/chat", "POST /api/blog"],
  });
});

// Q&A chat
app.post("/api/chat", async (req, res) => {
  try {
    const keyCheck = requireKey();
    if (!keyCheck.ok) return res.status(keyCheck.status).json(keyCheck.body);

    const message = (req.body?.message || "").toString().trim();
    if (!message) {
      return res.status(400).json({ error: "message 가 비어있습니다." });
    }

    const systemGuide = `
너는 '정책자금 AI 비서'다.
- 사용자의 질문에 대해 이해하기 쉬운 한국어로 답한다.
- 가능하면 '대상/자격 → 핵심요건 → 준비서류 → 신청흐름 → 주의사항' 순서로 정리한다.
- 확정적 수치/조건은 공고 확인을 권고한다.
- 너무 장황하지 않게, 실무적으로.
`;

    const input = [
      {
        role: "system",
        content: [{ type: "text", text: systemGuide.trim() }],
      },
      {
        role: "user",
        content: [{ type: "text", text: message }],
      },
    ];

    const out = await callOpenAIResponses({ input, temperature: 0.6 });

    return res.json({
      reply:
        out.text ||
        "답변 생성에 실패했습니다. 질문을 조금 더 구체적으로 입력해 주세요.",
      disclaimer: "⚠️ 정확한 정보는 반드시 해당 공고/기관 안내를 확인하세요.",
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || "Server error",
      hint:
        status === 401
          ? "OpenAI 키가 잘못됐거나 권한이 없습니다. 키를 재발급/교체 후 Redeploy 해주세요."
          : status === 429
          ? "요청이 많거나 한도 초과입니다. 잠시 후 다시 시도하세요."
          : "Vercel Runtime Logs에서 에러 원인을 확인해 주세요.",
    });
  }
});

// Blog draft
app.post("/api/blog", async (req, res) => {
  try {
    const keyCheck = requireKey();
    if (!keyCheck.ok) return res.status(keyCheck.status).json(keyCheck.body);

    const title = (req.body?.title || "").toString().trim();
    const topic = (req.body?.topic || "").toString().trim();
    const keyword = (req.body?.keyword || "").toString().trim();

    if (!title && !topic && !keyword) {
      return res
        .status(400)
        .json({ error: "title/topic/keyword 중 하나는 필요합니다." });
    }

    const prompt = `
아래 정보를 바탕으로 '정책자금' 관련 네이버 블로그 글 초안을 한국어로 작성해줘.

[요구사항]
- 구조: 문제제기 → 정보제공 → 경험결합(사례 톤) → CTA(관심→행동→문의)
- 너무 과장하지 말고, 실무자처럼.
- 마지막에 '⚠️ 공고 확인' 문구 포함.
- 길이: 1,200~1,800자 정도.
- 소제목/불릿 적절히 사용.

[입력]
제목: ${title || "(제목 미정)"}
주제: ${topic || "(주제 미정)"}
핵심키워드: ${keyword || "(키워드 미정)"}
`;

    const input = [
      {
        role: "system",
        content: [{ type: "text", text: "너는 정책자금/지원사업 전문 블로그 작가다." }],
      },
      { role: "user", content: [{ type: "text", text: prompt.trim() }] },
    ];

    const out = await callOpenAIResponses({ input, temperature: 0.7 });

    return res.json({
      title: title || "정책자금 정보 정리",
      content:
        out.text ||
        "글 생성에 실패했습니다. title/topic/keyword 를 조금 더 구체적으로 입력해 주세요.",
      disclaimer: "⚠️ 정확한 정보는 반드시 해당 공고/기관 안내를 확인하세요.",
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || "Server error",
      hint: "Vercel Runtime Logs에서 에러 원인을 확인해 주세요.",
    });
  }
});

// local dev
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
