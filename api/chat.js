// /api/chat.js
const OpenAIImport = require("openai");
const OpenAI = OpenAIImport.default || OpenAIImport;

function setCors(res) {
  // 아임웹 도메인을 정확히 허용하고 싶으면 "*" 대신 아래처럼 바꾸세요:
  // res.setHeader("Access-Control-Allow-Origin", "https://sinjawon007.imweb.me");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

module.exports = async function handler(req, res) {
  setCors(res);

  // ✅ 프리플라이트(OPTIONS) 반드시 처리
  if (req.method === "OPTIONS") return res.status(200).end();

  // ✅ POST만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "message required" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing in env" });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "너는 정책자금 전문 AI 비서다. 간단명료하게 답하되, 마지막 줄에 반드시 '⚠️ 정확한 정보는 공고를 꼭 확인하세요'를 붙여라.",
        },
        { role: "user", content: String(message) },
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e?.message || String(e),
    });
  }
};
