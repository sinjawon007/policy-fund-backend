import OpenAI from "openai";

export default async function handler(req, res) {
  // ✅ CORS 허용 (이게 핵심)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ preflight 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "너는 정책자금 전문 AI 비서다. 답변 끝에는 항상 '⚠️ 정확한 정보는 공고를 꼭 확인하세요'를 붙여라.",
        },
        { role: "user", content: message },
      ],
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e.message,
    });
  }
}
