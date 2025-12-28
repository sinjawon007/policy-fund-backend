const express = require("express");
const cors = require("cors");
// Node 18+ (Vercel)에서는 native fetch가 내장되어 있어 require('node-fetch')가 필요 없지만,
// 로컬 환경 호환성을 위해 필요하다면 유지하거나 아래 주석처럼 처리합니다.
// const fetch = require("node-fetch"); 

const app = express();

// 아임웹/로컬 등 어디서든 호출되게 설정
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// ✅ OpenAI 키/모델 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// 모델명 수정: gpt-4.1-mini (X) -> gpt-4o-mini (O) 또는 gpt-4o
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; 

// 헬스 체크
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버 (OpenAI)",
    endpoints: ["POST /api/chat", "POST /api/blog"],
  });
});

// (테스트용) GET /api/chat 안내
app.get("/api/chat", (req, res) => {
  res.status(200).json({
    ok: true,
    hint: "여기는 POST 전용입니다. POST /api/chat (JSON: { message: '...' }) 로 호출하세요.",
  });
});

// ✅ 채팅 API
app.post("/api/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim();
    if (!message) return res.status(400).json({ error: "message가 비었습니다." });

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY가 설정되어 있지 않습니다. (Vercel Environment Variables 확인)",
      });
    }

    const systemPrompt = [
      "너는 한국의 정책자금/정부지원금 안내 도우미다.",
      "모르는 내용은 추측하지 말고 '공고 확인 필요'라고 말한다.",
      "답변은 한국어로, 핵심부터 짧게, 마지막에 체크리스트 3개를 제시한다.",
    ].join("\n");

    // ✅ OpenAI 표준 API 호출 (v1/chat/completions)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return res.status(response.status).json({ error: data?.error || data });
    }

    // 표준 응답 추출 방식
    const reply = data.choices?.[0]?.message?.content || "응답 생성 실패";
    return res.json({ reply });

  } catch (e) {
    console.error("Server Error:", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// ✅ 블로그 작성 API
app.post("/api/blog", async (req, res) => {
  try {
    const topic = (req.body?.topic || "").toString().trim();
    if (!topic) return res.status(400).json({ error: "topic이 비었습니다." });

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY가 설정되어 있지 않습니다.",
      });
    }

    const systemPrompt = [
      "너는 한국어 블로그 글 작성자다.",
      "구조는 문제제기 → 정보제공 → 경험결합 → CTA로 작성한다.",
      "과장/허위 금지. 공고/기관 확인 문구를 포함한다.",
      "문단 짧게, 소제목 포함, 마지막에 CTA 3단계(관심→행동→문의) 넣는다.",
    ].join("\n");

    const userPrompt = `주제: ${topic}\n\n정책자금/정부지원금 블로그 글을 1200~1800자 정도로 작성해줘.`;

    // ✅ OpenAI 표준 API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return res.status(response.status).json({ error: data?.error || data });
    }

    const blog = data.choices?.[0]?.message?.content || "글 생성 실패";
    return res.json({ blog }); // 클라이언트(아임웹)에서는 response.blog 로 받음

  } catch (e) {
    console.error("Server Error:", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// Vercel 환경에서는 app을 export 해야 함
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
