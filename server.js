const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

// ====== 환경변수 ======
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// (선택) 아임웹만 허용하고 싶다면 IMWEB_ORIGIN 설정 후 아래 코드의 allowlist를 사용하세요.
const IMWEB_ORIGIN = process.env.IMWEB_ORIGIN;

// ====== 미들웨어 ======
app.use(
  cors({
    origin: function (origin, callback) {
      // 서버-서버 요청/로컬 테스트(Origin 없음) 허용
      if (!origin) return callback(null, true);

      // IMWEB_ORIGIN을 설정했으면 그 도메인만 허용
      if (IMWEB_ORIGIN) {
        if (origin === IMWEB_ORIGIN) return callback(null, true);
        return callback(new Error("CORS blocked: Not allowed origin"), false);
      }

      // IMWEB_ORIGIN 미설정이면 모두 허용(테스트 편의)
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

function getClient() {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 없습니다. (Vercel Environment Variables에 설정하세요)");
  }
  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

// ====== 헬스체크 ======
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버 (OpenAI)",
    endpoints: ["POST /api/chat", "POST /api/blog"]
  });
});

// ====== /api/chat ======
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "message(문자열)를 입력해주세요." });
    }

    const openai = getClient();

    const systemPrompt = `
당신은 '정책자금 AI 비서'입니다.
- 한국어로 친절하고 실무적으로 답변합니다.
- 과장/확답/단정은 피합니다.
- 체크리스트/절차/주의사항을 보기 좋게 정리합니다.
- 마지막 줄에 반드시:
⚠️ 정확한 정보는 공고를 꼭 확인하세요
를 붙입니다.
`.trim();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.5
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim() || "";

    return res.json({
      success: true,
      message: reply,
      disclaimer: "⚠️ 정확한 정보는 공고를 꼭 확인하세요"
    });
  } catch (err) {
    console.error("❌ /api/chat error:", err);
    return res.status(500).json({
      success: false,
      error: "AI 호출 중 오류가 발생했습니다.",
      detail: err?.message || String(err)
    });
  }
});

// ====== /api/blog ======
app.post("/api/blog", async (req, res) => {
  try {
    const { topic, extra } = req.body || {};
    const t = topic && typeof topic === "string" ? topic : "정책자금";

    const openai = getClient();

    const blogSystem = `
당신은 네이버 블로그 전문 작성자입니다.
- 읽기 쉬운 구조(목차/소제목/체크리스트/절차)
- 과장 금지, 실제 신청 시 공고 확인 안내 필수
- 마지막 CTA 3단계(관심→행동→문의)
`.trim();

    const blogUser = `
주제: ${t}
추가요청: ${extra || "없음"}

요구사항:
1) 제목 1개
2) 목차 4~6개
3) 본문(소제목 포함)
4) 체크리스트 6~10개
5) 신청 절차(단계별)
6) 마지막 CTA 3단계:
   - 관심유도 → 행동유도 → 직접문의유도
7) 마지막 줄:
⚠️ 정확한 정보는 공고를 꼭 확인하세요
`.trim();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: blogSystem },
        { role: "user", content: blogUser }
      ],
      temperature: 0.6
    });

    const content = completion?.choices?.[0]?.message?.content?.trim() || "";

    // 아주 단순하게 첫 줄을 제목으로 잡는 방식(원하면 나중에 더 예쁘게 파싱 가능)
    const lines = content.split("\n").map((v) => v.trim()).filter(Boolean);
    const title = lines[0]?.replace(/^#+\s*/, "") || `${t} 블로그 글`;

    return res.json({
      success: true,
      title,
      content
    });
  } catch (err) {
    console.error("❌ /api/blog error:", err);
    return res.status(500).json({
      success: false,
      error: "블로그 생성 중 오류가 발생했습니다.",
      detail: err?.message || String(err)
    });
  }
});

// ====== 로컬 실행용 ======
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// Vercel 서버리스에서도 import 해서 쓸 수 있게 export
module.exports = app;
