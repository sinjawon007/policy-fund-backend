import OpenAI from "openai";

export default async function handler(req, res) {
  // ✅ CORS 허용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "topic required" });
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
            "정책자금 블로그 글을 SEO 최적화 구조로 작성하라. 마지막에 반드시 주의문구 포함.",
        },
        { role: "user", content: topic },
      ],
    });

    return res.json({
      content: completion.choices[0].message.content,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "AI 호출 실패",
      detail: e.message,
    });
  }
}
