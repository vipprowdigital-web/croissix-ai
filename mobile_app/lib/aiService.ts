// mobile_app\lib\aiService.ts

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateReviewReply(
  review: string,
  rating: number,
  reviewerName?: string,
  businessName?: string,
  businessCategory?: string,
  tone?: string,
) {

  const prompt = `
You are the owner of a Google Business Profile replying to a customer review.

Your objectives:
• Write a natural and human reply
• Strengthen the Google Business Profile SEO
• Reinforce the business name and services naturally
• Increase trust and encourage future visits

Business Name: ${businessName || "our business"}
Business Type: ${businessCategory || "local business"}

Reviewer Name: ${reviewerName || "Customer"}
Rating: ${rating}/5

Customer Review:
"${review}"

Guidelines:
- Start by thanking the reviewer by name if available.
- Mention the business name naturally once.
- If the review mentions a service or product, acknowledge it specifically.
- Reinforce the main business service naturally for SEO.
- Keep the reply warm, genuine, and conversational.
- Encourage them to visit again or recommend the business.
- Keep under 120 words.
- Avoid repeating the review word-for-word.
- Avoid sounding robotic or like a template.
- Write as a real business owner would respond.

Tone: ${tone || "Professional but friendly"}

Write the reply now.
`;

  const completion = await groq.chat.completions.create({
    model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.9,
    max_tokens: 180,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim() || "";

  // ✅ Append signature automatically
  const signature = `

Best Regards,  
${businessName || "Our Business"} Team`;

  return reply + signature;
}