/**
 * policy-fund-backend / server.js
 * Express 기반: POST /api/chat, POST /api/blog
 * ENV: OPENAI_API_KEY (필수), OPENAI_MODEL (선택, 기본 gpt-4.1-mini)
 */

const express = require("express");
const cors = require("cors");

const app = express();

// ====== 환경변수 ======
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const PORT = process.env.PORT || 3000;

// Vercel/Node 18+ 에서는 fetch 기본 제공. (로컬이 구버전이면 node-fetch 필요)
const hasFetch = typeof fetch === "function";
if (!hasFetch) {
  console.error("This runtime does not support fetch(). Use Node 18+.");
}

// ====== 미들웨어 ======
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ====== 헬스 체크 ======
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버 (OpenAI)",
    endpoints: ["POST /api/chat - AI 채팅", "POST /api/blog - AI 블로그 작성"],
    model: OPENAI_MODEL,
  });
});

// ====== OpenAI 호출 유틸 ======
async function callOpenAIChat({ userMessage, systemPrompt }) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Set it in Vercel Environment Variables.");
  }
  if (!userMessage) {
    throw new Error("userMessage is required.");
  }

  const body = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          systemPrompt ||
          "당신은 정책자금 상담을 돕는 AI 비서입니다. 정확하지 않은 내용은 단정하지 말고 확인이 필요하다고 안내하세요.",
      },
      { role: "user", content: userMessage },
    ],
    temperature: 0.4,
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (!resp.ok) {
    const msg =
      data?.error?.message ||
      `OpenAI API error (status ${resp.status})`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  return text;
}

// ====== /api/chat ======
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "메시지를 입력해주세요." });
    }

    const answer = await callOpenAIChat({ userMessage: message });

    return res.json({
      ok: true,
      answer,
      disclaimer: "⚠️ 정확한 정보는 반드시 해당 공고/기관 안내를 확인하세요.",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "서버 오류",
    });
  }
});

// ====== /api/blog ======
app.post("/api/blog", async (req, res) => {
  try {
    const { topic, tone, keywords } = req.body || {};

    const safeTopic = (topic || "").trim();
    if (!safeTopic) {
      return res.status(400).json({ error: "topic(주제)를 입력해주세요." });
    }

    const sys =
      "당신은 한국어 블로그 글 작성 전문가입니다. 문장은 자연스럽게, 과장/허위는 금지. 신청 공고·세부 조건은 변동 가능하므로 확인 안내를 포함하세요.";
    const user =
      `주제: ${safeTopic}\n` +
      `톤: ${tone || "친근하고 실무형"}\n` +
      `핵심 키워드(가능하면 본문에 자연스럽게): ${Array.isArray(keywords) ? keywords.join(", ") : (keywords || "정책자금, 정부지원금")}\n\n` +
      `요구사항:\n` +
      `- 구조: 문제제기 → 정보제공 → 경험결합(사례/예시) → CTA(관심유도→행동유도→직접문의유도)\n` +
      `- 제목 5개 후보 + 본문(최소 1200자) + 마지막에 체크리스트(5~7개)\n` +
      `- 마지막 문단에 "공고 확인" 주의문구 포함\n`;

    const blog = await callOpenAIChat({
      userMessage: user,
      systemPrompt: sys,
    });

    return res.json({
      ok: true,
      blog,
      disclaimer: "⚠️ 공고/기관 안내를 최종 확인하세요.",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "서버 오류",
    });
  }
});

// ====== 로컬 실행용 (Vercel에서는 무시될 수 있음) ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
