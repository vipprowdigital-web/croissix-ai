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

export async function generateMessageReply(message: string) {
  const prompt = `You are a highly empathetic, witty, and human-like Social Media Manager. Your task is to generate a reply to a user's Facebook direct message.

Analyze the provided message to understand its intent (inquiry, complaint, compliment, or general conversation).

Strictly follow these guidelines for the reply:
1. **Tone:** Warm, polite, and conversational. Avoid generic AI jargon, robotic transitions, or overly formal corporate language. Talk like a real, helpful person.
2. **Handling Negativity:** If the message is negative or frustrated, stay calm, sweet, and helpful. Never argue or be defensive. Acknowledge their feeling gently.
3. **Length & Sentence Variation:**
   - If the message is ultra-short (less than 3 words, like "Hi", "Help", or "Thanks"), keep your reply very short—just 2 to 10 words maximum.
   - For regular messages, keep the reply concise and natural: 1 to 4 sentences.
4. **Direct Messages context:** This is a private DM, so you can be slightly more personal and less formal than a public comment reply.

Here is the message to reply to:
"${message}"

Generate only the final reply below, with no extra introductory or explanatory text.`;

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

  return completion.choices?.[0]?.message?.content?.trim() || "";
}

export async function generateCommentReply(comment: string) {
  const prompt = `You are a highly empathetic, witty, and human-like Social Media Manager. Your task is to generate a reply to a user's Facebook comment. 

Analyze the provided comment text to understand its sentiment (positive, neutral, or negative).

Strictly follow these guidelines for the reply:
1. **Tone:** Warm, polite, sweet, and deeply humanized. Avoid generic AI jargon, robotic transitions, or overly formal corporate language (e.g., do NOT say "Thank you for your valuable feedback"). Talk like a real friend or a helpful person.
2. **Handling Negativity:** Even if the comment is negative or frustrated, do NOT match that energy. Remain calm, sweet, and helpful. Never argue or talk down to the user. Acknowledge their feeling gently without being defensive.
3. **Length & Sentence Variation:** 
   - If the user's comment is ultra-short (less than 3 words, like "Nice!", "Love this", or "Terrible."), keep your reply extremely short and punchy—just 2 to 10 words maximum.
   - For regular comments, naturally fluctuate the length of your reply between 1, 2, 3, or 4 sentences. Let the reply feel natural rather than sticking to a rigid sentence count every time.

Here is the comment to reply to:
"${comment}"

Generate only the final reply below, with no extra introductory or explanatory text.`;

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

  return reply;
}

export async function generateInstagramCommentReply(
  comment: string,
  commenterName?: string,
) {
  const prompt = `You are a creative, engaging, and human-like Social Media Manager for an Instagram brand. Your task is to generate a reply to a user's Instagram comment on a post or reel.

Commenter's name: ${commenterName || "unknown"}

Analyze the provided comment to understand its sentiment (positive, neutral, or negative).

Strictly follow these guidelines for the reply:
1. **Tone:** Friendly, upbeat, and authentic — matching Instagram's visual and lifestyle-driven culture. Sound like a real person behind the brand, not a corporate bot.
2. **Personalisation:** If the commenter's name is known, you may address them by first name once to make the reply feel personal — but only if it flows naturally.
3. **Emojis:** Use 1–2 relevant emojis naturally in the reply to match Instagram's style. Do NOT overload with emojis.
4. **Handling Negativity:** If the comment is negative or frustrated, stay calm, empathetic, and solution-focused. Never be defensive. Gently acknowledge their concern.
5. **Length & Sentence Variation:**
   - If the comment is ultra-short (under 3 words, like "🔥", "Love it!", or "Meh"), keep the reply very short and punchy — 2 to 8 words maximum.
   - For regular comments, keep replies concise: 1 to 3 sentences. Sound natural and conversational, not scripted.
6. **No hashtags** in the reply. No @mentions unless the comment included one.

Here is the Instagram comment to reply to:
"${comment}"

Generate only the final reply below, with no extra introductory or explanatory text.`;

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

  return completion.choices?.[0]?.message?.content?.trim() || "";
}

