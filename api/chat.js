// /api/chat.js
const OpenAI = require("openai");

module.exports = async function handler(req, res) {
  // 1. CORS 헤더 강제 설정 (어떤 상황에서도 반환되도록 맨 위에 배치)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 2. Preflight 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 3. API Key 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("환경 변수에 OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    // 4. 요청 데이터(Body) 파싱 - 가장 안전한 방법 사용
    let body = req.body;
    
    // 만약 body가 없거나 빈 객체라면 문자열 파싱 시도
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        // Vercel 등에서 가끔 body가 제대로 파싱되지 않을 때를 대비
        if (req.body && typeof req.body === 'string') {
             body = JSON.parse(req.body);
        }
    }
    
    // 최종적으로 문자열인 경우 다시 파싱
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        throw new Error("전송된 데이터가 JSON 형식이 아닙니다. (" + body + ")");
      }
    }

    const userMessage = body?.message || body?.topic; // 채팅(message)과 블로그(topic) 둘 다 대응

    if (!userMessage) {
       throw new Error("질문 내용(message)이 비어있습니다. 전달된 데이터: " + JSON.stringify(body));
    }

    // 5. OpenAI 호출
    const openai = new OpenAI({ apiKey: apiKey });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 친절하고 전문적인 '정책자금 AI 비서'입니다. 한국어로 답변해주세요."
        },
        { role: "user", content: userMessage },
      ],
    });

    // 6. 성공 응답
    const aiReply = completion.choices[0].message.content;
    return res.status(200).json({ reply: aiReply, content: aiReply }); // chat.js와 blog.js 양쪽 호환

  } catch (error) {
    console.error("🔥 서버 에러 발생:", error);
    
    // ⚠️ 중요: 에러가 나도 500이 아니라 200으로 보내서, 브라우저가 에러 메시지를 읽을 수 있게 함
    return res.status(200).json({ 
      error: "서버 내부 오류", 
      message: error.message, 
      detail: error.toString() 
    });
  }
};
