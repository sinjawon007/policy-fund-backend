const OpenAI = require("openai");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "너는 정책자금 전문 AI 비서다. 답변 끝에는 항상 '⚠️ 정확한 정보는 공고를 꼭 확인하세요'를 붙여라.",
        },
        { role: "user", content: message },
      ],
    });

    return res.status(200).json({
      reply: response.output_text,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e.message,
    });
  }
};
