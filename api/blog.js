// /api/blog.js
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
      console.error("❌ 오류: API Key가 없습니다. Vercel 환경변수를 확인하세요.");
      return res.status(500).json({ error: "Configuration Error", message: "서버 API 키 설정 오류" });
    }

    // 4. 데이터 파싱 (문자열로 들어올 경우 대비)
    let requestBody = req.body;
    if (typeof requestBody === "string") {
      try {
        requestBody = JSON.parse(requestBody);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON", message: "데이터 형식이 잘못되었습니다." });
      }
    }

    const { topic } = requestBody || {};
    if (!topic) return res.status(400).json({ error: "Missing Topic", message: "주제(topic)가 입력되지 않았습니다." });

    // 5. OpenAI 호출
    const openai = new OpenAI({ apiKey: apiKey });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "정책자금 블로그 글을 '문제제기→정보제공→경험결합→CTA' 구조로 SEO 최적화하여 작성해라. '⚠️ 정확한 정보는 공고를 꼭 확인하세요'를 마지막에 포함해라."
        },
        { role: "user", content: `주제: ${topic}` },
      ],
    });

    // 6. 성공 응답
    return res.status(200).json({ content: completion.choices[0].message.content });

  } catch (error) {
    console.error("🔥 서버 에러:", error);
    // 어떤 에러인지 프론트엔드에서도 볼 수 있게 전달
    return res.status(500).json({ 
      error: "AI 호출 실패", 
      message: error.message 
    });
  }
};
