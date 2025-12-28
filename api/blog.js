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
    const { topic } = req.body || {};
    if (!topic) {
      return res.status(400).json({ error: "topic required" });
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
            "정책자금 블로그 글을 SEO 최적화 구조(문제제기→정보제공→사례→CTA)로 작성하고 마지막에 주의문구를 포함하라.",
        },
        { role: "user", content: topic },
      ],
    });

    return res.status(200).json({
      content: response.output_text,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e.message,
    });
  }
};
