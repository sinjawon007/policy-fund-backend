// api/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing",
      });
    }

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const message = body?.message;
    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
너는 정책자금 전문 AI 비서다.
한국 소상공인·중소기업 관점에서 이해하기 쉽게 설명하라.
마지막 줄에 반드시 다음 문구를 포함하라:

⚠️ 정확한 정보는 공고를 꼭 확인하세요

질문:
${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({
      error: "Gemini API error",
      detail: e.message,
    });
  }
};
