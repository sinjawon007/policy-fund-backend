// /api/blog.js
const OpenAIImport = require("openai");
const OpenAI = OpenAIImport.default || OpenAIImport;

function setCors(res) {
  // 정확히 허용: "https://sinjawon007.imweb.me"
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { topic } = req.body || {};
    if (!topic) return res.status(400).json({ error: "topic required" });

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
            "정책자금 블로그 글을 '문제제기→정보제공→경험결합→CTA' 구조로 SEO 최적화로 작성해라. 마지막에 반드시 '⚠️ 정확한 정보는 공고를 꼭 확인하세요' 포함.",
        },
        { role: "user", content: String(topic) },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ content });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e?.message || String(e),
    });
  }
};
