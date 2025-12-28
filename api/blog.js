// /api/blog.js
const OpenAI = require("openai");

// CORS 설정 함수 (보안 및 접속 허용)
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // 테스트를 위해 일단 전체 허용
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  // 1. CORS 헤더 적용
  setCors(res);

  // 2. Preflight 요청(OPTIONS) 처리 - 브라우저 접속 에러 방지
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 3. POST 방식이 아니면 거절
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", message: "POST 요청만 가능합니다." });
  }

  try {
    // 4. API Key 확인 (가장 흔한 에러 원인)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ 오류: Vercel 환경변수에 OPENAI_API_KEY가 없습니다.");
      return res.status(500).json({ error: "Server Configuration Error", message: "API Key가 설정되지 않았습니다." });
    }

    // 5. 요청 데이터(Body) 파싱 안전장치
    let requestBody = req.body;
    
    // Vercel에서 가끔 body가 문자열로 들어오는 경우 처리
    if (typeof requestBody === "string") {
      try {
        requestBody = JSON.parse(requestBody);
      } catch (parseError) {
        console.error("❌ JSON 파싱 에러:", parseError);
        return res.status(400).json({ error: "Invalid JSON", message: "전송된 데이터가 올바른 JSON 형식이 아닙니다." });
      }
    }

    const { topic } = requestBody || {};
    
    // 주제가 비어있을 경우 방어
    if (!topic) {
      return res.status(400).json({ error: "Missing Parameter", message: "주제(topic) 내용이 없습니다." });
    }

    console.log(`🚀 AI 글쓰기 시작: 주제 - ${topic}`);

    // 6. OpenAI 인스턴스 생성
    const openai = new OpenAI({ apiKey: apiKey });

    // 7. AI 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "정책자금 블로그 글을 '문제제기→정보제공→경험결합→CTA' 구조로 SEO 최적화하여 작성해라. 전문적이지만 읽기 쉬운 톤앤매너를 유지해라. 마지막에 반드시 '⚠️ 정확한 정보는 공고를 꼭 확인하세요' 문구를 포함해라.",
        },
        { role: "user", content: `주제: ${topic}` },
      ],
      temperature: 0.7, // 창의성 조절
    });

    const content = completion.choices[0].message.content;

    // 성공 응답 반환
    return res.status(200).json({ result: "success", content: content });

  } catch (error) {
    // 8. 에러 로그 상세 출력 (Vercel 로그에서 확인 가능)
    console.error("🔥 서버 에러 발생:", error);
    
    return res.status(500).json({
      error: "Internal Server Error",
      message: "AI 글쓰기 중 오류가 발생했습니다.",
      details: error.message // 에러 내용을 프론트엔드로 전달
    });
  }
};
