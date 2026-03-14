// mobile_app\lib\aiService.ts

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateReviewReply(
  review: string,
  rating: number,
  reviewerName?: string,
  tone?: string,
) {
  const prompt = `
You are a friendly business owner replying to a Google review.

Write a natural, human-like response.

Guidelines:
- Start by thanking the reviewer by their name if available
- Mention something related to their review
- Keep the tone warm, genuine and conversational
- Do not sound robotic
- Keep under 120 words
- Do NOT repeat the review
- Sound like a real human owner

Tone: ${tone || "Professional"}

Reviewer Name: ${reviewerName || "Customer"}

Rating: ${rating}/5

Customer Review:
"${review}"

Write a thoughtful reply from the business owner:
`;

  const completion = await groq.chat.completions.create({
    model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 180,
  });

  return completion.choices?.[0]?.message?.content || "";
}
