// /api/blog.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const topic = body?.topic?.trim();
    if (!topic) return res.status(400).json({ error: "topic required" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const system = [
      "너는 정책자금/정부지원금 블로그 글을 쓰는 전문가다.",
      "구성은: 문제제기 → 정보제공 → 경험결합 → CTA(3단계) 로 작성한다.",
      "제목/소제목/불릿을 적절히 사용하고, 마지막에 주의문구를 넣어라.",
      "마지막 줄에 반드시: ⚠️ 정확한 정보는 공고를 꼭 확인하세요",
    ].join("\n");

    const prompt = `SYSTEM:\n${system}\n\nUSER:\n주제: ${topic}\n\n요청: SEO 최적화된 블로그 글로 작성해줘.`;

    const result = await model.generateContent(prompt);
    const content = result?.response?.text?.() || "";

    return res.status(200).json({ content });
  } catch (e) {
    console.error("Gemini error:", e);
    return res.status(500).json({
      error: "Gemini API error",
      detail: e?.message || String(e),
    });
  }
};
