// /api/chat.js
const OpenAI = require("openai");

// CORS 설정 (보안 및 접속 허용)
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  // 1. CORS 및 Preflight 처리
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  // 2. POST 요청 체크
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", message: "POST 요청만 가능합니다." });
  }

  try {
    // 3. API Key 로드 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ 오류: API Key가 없습니다.");
      return res.status(500).json({ error: "Configuration Error", message: "서버 API 키 설정 오류" });
    }

    // 4. 데이터 파싱
    let requestBody = req.body;
    if (typeof requestBody === "string") {
      try {
        requestBody = JSON.parse(requestBody);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON", message: "데이터 형식이 잘못되었습니다." });
      }
    }

    const { message } = requestBody || {};
    if (!message) return res.status(400).json({ error: "Missing Message", message: "질문 내용이 없습니다." });

    // 5. OpenAI 호출 (채팅용)
    const openai = new OpenAI({ apiKey: apiKey });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 소상공인과 중소기업을 돕는 '정책자금 전문 AI 비서'입니다. 사용자의 질문에 친절하고 전문적으로 답변하세요. 답변은 한국어로 명확하게 작성하세요."
        },
        { role: "user", content: message },
      ],
    });

    // 6. 성공 응답
    return res.status(200).json({ reply: completion.choices[0].message.content });

  } catch (error) {
    console.error("🔥 서버 에러:", error);
    return res.status(500).json({ 
      error: "AI 호출 실패", 
      message: error.message 
    });
  }
};
