const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Vercel 환경변수에서 가져옴
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 헬스 체크
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "정책자금 AI 비서 백엔드 서버",
    endpoints: ["POST /api/chat - AI 채팅", "POST /api/blog - AI 블로그 작성"],
  });
});

// ✅ OpenAI Responses API 호출 (서버에서만 키 사용)
async function callOpenAI({ input, system }) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.");
  }

  const payload = {
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: system || "당신은 정책자금 상담 AI입니다." },
      { role: "user", content: input },
    ],
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) {
    const msg = data?.error?.message || "OpenAI API 호출 실패";
    throw new Error(msg);
  }

  // responses API 결과에서 텍스트 추출
  // output_text가 있으면 가장 간단
  const text = data.output_text
    || (Array.isArray(data.output) ? data.output.map(o => o?.content?.map(c => c?.text).filter(Boolean).join("")).join("\n") : "")
    || "";

  return text.trim();
}

// AI 채팅
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "메시지를 입력해주세요." });
    }

    const system =
      "너는 한국의 정책자금/정부지원금 상담 AI 비서다. " +
      "사용자가 질문하면: 1) 핵심 요약 2) 가능한 제도/유형 3) 준비서류/체크리스트 4) 다음 행동(CTA) 순서로 답한다. " +
      "법/세무/심사 확정 표현은 피하고, 공고 확인을 권장한다.";

    const reply = await callOpenAI({ input: message, system });

    res.json({
      reply,
      disclaimer: "⚠️ 정확한 정보는 공고를 꼭 확인하세요",
    });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// AI 블로그 작성
app.post("/api/blog", async (req, res) => {
  try {
    const { topic, title, content } = req.body || {};
    if (!topic) return res.status(400).json({ error: "topic(주제)를 입력해주세요." });

    const system =
      "너는 한국 네이버 블로그 글쓰기 전문가다. " +
      "구조는: 문제제기 → 정보제공 → 경험결합 → CTA(관심→행동→문의)로 작성한다. " +
      "지나친 과장 금지, 공고 확인 문구 포함.";

    const prompt =
      `주제: ${topic}\n\n` +
      `현재 제목(있으면 반영): ${title || "(없음)"}\n` +
      `현재 내용(있으면 참고):\n${content || "(없음)"}\n\n` +
      "요청: 1) SEO형 제목 1개 2) 본문 1200~1800자 3) 소제목/불릿 적절히 4) 마지막 CTA 포함.";

    const blogText = await callOpenAI({ input: prompt, system });

    // 간단히 첫 줄을 제목으로 뽑는 방식(없으면 topic 사용)
    const lines = blogText.split("\n").map(s => s.trim()).filter(Boolean);
    const genTitle = lines[0]?.length <= 60 ? lines[0] : (title || topic);

    res.json({
      title: genTitle,
      content: blogText,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
