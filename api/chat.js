// /api/chat.js
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

    // body 파싱 (Vercel에서 string으로 들어오는 경우 대비)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message?.trim();
    if (!message) return res.status(400).json({ error: "message required" });

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ 가장 호환 잘 되는 기본 모델 (안 되면 여기만 바꾸면 됨)
    // "gemini-1.5-flash" 또는 "gemini-1.5-pro"가 보통 정상입니다.
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const system = [
      "너는 '정책자금' 상담을 돕는 전문 AI 비서다.",
      "답변은 한국어로, 항목/불릿으로 핵심부터 정리한다.",
      "마지막 줄에 반드시: ⚠️ 정확한 정보는 공고를 꼭 확인하세요",
    ].join("\n");

    // ✅ Gemini 권장: generateContent에 system+user를 한 프롬프트로 넣기
    const prompt = `SYSTEM:\n${system}\n\nUSER:\n${message}`;

    const result = await model.generateContent(prompt);
    const reply = result?.response?.text?.() || "";

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Gemini error:", e);
    return res.status(500).json({
      error: "Gemini API error",
      detail: e?.message || String(e),
    });
  }
};
