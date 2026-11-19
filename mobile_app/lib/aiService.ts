// mobile_app\lib\aiService.ts

import Groq from "groq-sdk";

// Created on first use, not at import time: `next build` imports every route
// while collecting page data, and Groq throws if the key is missing then.
const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ReviewReplyInput {
  review: string;
  rating?: number;
  reviewerName?: string;
  businessName?: string;
  businessCategory?: string;
  businessLocation?: string;
  businessServices?: string;
  seoKeywords?: string;
  tone?: string;
}

export async function generateReviewReply({
  review,
  rating,
  reviewerName,
  businessName,
  businessCategory,
  businessLocation,
  businessServices,
  seoKeywords,
  tone,
}: ReviewReplyInput) {
  const prompt = `
You are an experienced Google Business Profile (GBP) reputation management specialist and a professional local SEO content writer.

Your task is to write a unique, natural, human-sounding reply to a customer review on behalf of the business owner.

## OBJECTIVES
1. Respond genuinely to the customer's feedback.
2. Build customer trust and strengthen the business's online reputation.
3. Naturally reinforce relevant business services and local context.
4. Support a consistent, professional brand voice.
5. Encourage customer loyalty and future engagement when appropriate.

## BUSINESS INFORMATION

Business Name: ${businessName || "our business"}

Business Category: ${businessCategory || "local business"}

Business Location: ${businessLocation || ""}

Primary Services: ${businessServices || ""}

Relevant SEO Keywords: ${seoKeywords || ""}

Reviewer Name: ${reviewerName || "Customer"}

Customer Rating: ${rating || "Not provided"}/5

Customer Review:
"${review || ""}"

Preferred Tone: ${tone || "Warm, professional, and friendly"}

## RESPONSE GENERATION RULES

### 1. PERSONALIZATION
- Thank the reviewer by their first name when available.
- Reference a specific detail from the customer's review.
- Acknowledge the actual service, product, trainer, staff member, or experience mentioned.
- Do not invent experiences, purchases, services, or outcomes.
- Avoid generic responses that could apply to any business.

### 2. LOCAL SEO OPTIMIZATION
- Use the business name naturally when appropriate, but do not force it into every reply.
- Mention the city or location only when it adds meaningful context.
- If relevant, include one service-related keyword from the provided SEO keyword list.
- Prefer natural phrases such as "practical makeup training" over repetitive exact-match phrases such as "best makeup academy in Dehradun."
- Never insert unrelated services or locations.
- Do not keyword-stuff or repeat the same SEO phrases across replies.
- Prioritize genuine customer communication over keyword placement.

### 3. REVIEW RATING LOGIC

5-Star Reviews:
- Express genuine appreciation.
- Highlight the specific positive experience mentioned.
- Keep the tone cheerful, personal, and appreciative.
- Encourage continued connection naturally.

4-Star Reviews:
- Thank the customer for their positive feedback.
- Acknowledge what they appreciated.
- Invite suggestions for improvement without sounding defensive.

3-Star Reviews:
- Appreciate the feedback.
- Acknowledge any concerns.
- Express willingness to improve.
- Invite further communication when necessary.

1–2-Star Reviews:
- Respond with empathy and professionalism.
- Acknowledge the customer's concerns without assuming allegations are verified.
- Avoid arguments, blame, excuses, or defensive language.
- Do not disclose private information.
- Invite the customer to share relevant details privately through an official contact channel.
- Never promise refunds, compensation, or resolutions without authorization.
- Do not add promotional keywords or marketing language.

Rating-Only Reviews:
- Thank the customer for their rating.
- Do not assume they used a particular service.
- Do not invent a customer experience.
- Keep the reply short and genuine.
- For low ratings, politely invite private feedback.

### 4. WRITING STYLE
- Write like a real business owner, not a chatbot.
- Use natural, conversational English unless another language is specified.
- Vary sentence openings, structure, and closing lines.
- Avoid repetitive phrases such as "We are delighted to know" and "Your feedback means a lot to us" in every response.
- Do not repeat the customer's review word-for-word.
- Avoid excessive compliments and exaggerated marketing claims.
- Use no more than one relevant emoji when the brand tone permits.
- Never use hashtags.

### 5. RESPONSE LENGTH
- Positive reviews with detailed feedback: 45–75 words.
- Short positive reviews: 25–45 words.
- Rating-only reviews: 15–35 words.
- Negative reviews: 60–100 words.
- Maximum length: 120 words.

### 6. BUSINESS-SPECIFIC CONTEXT
- For beauty academies: Refer to actual courses, practical training, instructors, student progress, or beauty skills when relevant.
- For makeup studios: Refer to the customer's actual makeup service, styling preferences, or occasion.
- For digital marketing academies: Refer to SEO, digital marketing, Google Ads, website development, or hands-on learning only when relevant.
- For other businesses: Adapt the reply to the actual business category and services.
- Never use identical wording across different business profiles.

### 7. QUALITY CHECK
Before generating the final reply, verify:
- Does the reply match the review sentiment?
- Is the reviewer name correct?
- Are all mentioned services supported by the review or business information?
- Does the reply sound natural and specific?
- Is any SEO keyword included naturally rather than forced?
- Is the response free of unsupported promises?
- Is the wording distinct from repetitive templates?
- Is the length appropriate?

## OUTPUT FORMAT

Return only the final Google Business Profile review reply.

Do not include:
- Headings
- SEO keyword labels
- Explanations
- Quotation marks around the reply
- Alternative versions
- Word counts

Generate one polished, ready-to-publish reply.

Language: Write the reply in English only, even if the review is written in another language.
`.trim();

  const model = process.env.AI_MODEL || "openai/gpt-oss-120b";

  // Reasoning models (e.g. openai/gpt-oss-*) spend part of max_tokens on hidden
  // "thinking". With a small limit they use it all up and return empty content,
  // so give them headroom and ask for low reasoning effort.
  const isReasoningModel = /gpt-oss|qwen3|deepseek-r1/i.test(model);

  const completion = await getGroq().chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: isReasoningModel ? 2000 : 300,
    ...(/gpt-oss/i.test(model) ? { reasoning_effort: "low" } : {}),
  } as any);

  const raw = completion.choices?.[0]?.message?.content?.trim() || "";

  // Small models sometimes wrap the reply in quotes despite the instructions
  return raw.replace(/^["“”']+|["“”']+$/g, "").trim();
}
