// /api/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  // 1. 통신 보안 설정 (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // 2. 환경변수에서 키 가져오기
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");

    // 3. 질문 내용 가져오기
    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch(e) {}
    }
    const userMessage = body?.message || body?.topic;

    if (!userMessage) throw new Error("질문 내용이 없습니다.");

    // 4. Gemini 모델 준비 (환경변수에 설정한 모델 사용)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

    // 5. AI에게 질문하기
    const prompt = `당신은 소상공인과 중소기업을 돕는 '정책자금 전문 스마트 AI 비서'입니다. 
    질문에 대해 한국어로 친절하고 전문적으로 답변하세요.
    
    질문: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 6. 결과 보내기
    return res.status(200).json({ reply: text, content: text });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(200).json({ 
      error: "AI 오류", 
      reply: "죄송합니다. 잠시 후 다시 시도해주세요. (" + error.message + ")" 
    });
  }
};
