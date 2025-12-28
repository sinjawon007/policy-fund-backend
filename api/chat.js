// /api/chat.js
const OpenAI = require("openai");

// 1. 보안 설정 (누구나 접속 가능하게 허용)
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  // 2. 기본 설정 적용
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", message: "POST 요청만 가능합니다." });
  }

  try {
    // 3. API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Config Error", message: "API 키가 설정되지 않았습니다." });
    }

    // 4. 질문 내용 가져오기
    let requestBody = req.body;
    if (typeof requestBody === "string") {
      try {
        requestBody = JSON.parse(requestBody);
      } catch (e) {
        return res.status(400).json({ error: "JSON Error", message: "데이터 형식이 잘못되었습니다." });
      }
    }

    const { message } = requestBody || {};
    if (!message) return res.status(400).json({ error: "Missing Message", message: "질문 내용이 없습니다." });

    // 5. AI에게 질문하기
    const openai = new OpenAI({ apiKey: apiKey });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 빠르고 똑똑한 모델
      messages: [
        {
          role: "system",
          content: "당신은 친절하고 유능한 '정책자금 상담 AI 비서'입니다. 사용자 질문에 대해 한국어로 전문적인 답변을 해주세요."
        },
        { role: "user", content: message },
      ],
    });

    // 6. 답변 보내기
    return res.status(200).json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("에러 발생:", error);
    return res.status(500).json({ error: "Server Error", message: "AI가 잠시 쉬고 있어요. 다시 시도해주세요." });
  }
};
