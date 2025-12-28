// api/chat.js
const OpenAI = require("openai");

// ✅ 허용할 프론트 도메인(여기만 허용)
const ALLOWED_ORIGINS = new Set([
  "https://sinjawon007.imweb.me",
  "https://www.sinjawon007.imweb.me",
]);

function setCors(req, res) {
  const origin = req.headers.origin;

  // 요청 Origin이 허용 목록에 있으면 그 Origin을 그대로 허용(가장 안전/확실)
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // 테스트용(콘솔/포스트맨 등 Origin 없는 요청)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // POST only
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Configuration Error",
        detail: "OPENAI_API_KEY 가 Vercel 환경변수에 없습니다.",
      });
    }

    // body 파싱(간혹 문자열로 들어오는 경우 대비)
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    const message = body?.message;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message required" });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "너는 정책자금 전문 AI 비서다. 한국어로 간결하고 실무적으로 답한다. 마지막 줄에 반드시 '⚠️ 정확한 정보는 공고를 꼭 확인하세요'를 붙인다.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ reply });
  } catch (e) {
    // ✅ 프론트가 “서버 응답 없음”으로 뭉개지 않도록 JSON으로 에러를 확실히 내림
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e?.message || String(e),
    });
  }
};
