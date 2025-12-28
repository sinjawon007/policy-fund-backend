// api/blog.js
const OpenAI = require("openai");

const ALLOWED_ORIGINS = new Set([
  "https://sinjawon007.imweb.me",
  "https://www.sinjawon007.imweb.me",
]);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Configuration Error",
        detail: "OPENAI_API_KEY 가 Vercel 환경변수에 없습니다.",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    const topic = body?.topic;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "topic required" });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "정책자금 블로그 글을 SEO 최적화 구조(문제제기→정보제공→경험/사례→CTA 3단계)로 작성하라. 마지막 줄에 반드시 '⚠️ 정확한 정보는 공고를 꼭 확인하세요'를 포함하라.",
        },
        { role: "user", content: topic },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e?.message || String(e),
    });
  }
};
