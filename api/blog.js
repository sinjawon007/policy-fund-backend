// api/blog.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { topic } = req.body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
주제: ${topic}

정책자금 블로그 글을 아래 구조로 작성하라.
1. 문제 제기
2. 정책자금 정보 설명
3. 실제 사례 톤
4. CTA
마지막 줄에 주의문구 포함:

⚠️ 정확한 정보는 공고를 꼭 확인하세요
`;

    const result = await model.generateContent(prompt);

    res.json({
      content: result.response.text(),
    });
  } catch (e) {
    res.status(500).json({
      error: "Gemini blog error",
      detail: e.message,
    });
  }
};
