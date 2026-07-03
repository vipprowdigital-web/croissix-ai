import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic,
      businessName = "our business",
      businessCategory = "",
      tone = "Friendly",
    } = body as {
      topic: string;
      businessName?: string;
      businessCategory?: string;
      tone?: string;
    };

    if (!topic?.trim()) {
      return Response.json({ success: false, error: "topic is required" }, { status: 400 });
    }

    const prompt = `You are an expert WhatsApp marketing copywriter for a ${businessCategory || "business"} called "${businessName}".

Write a WhatsApp message for the following topic:
"${topic}"

Tone: ${tone}

WHATSAPP MESSAGE RULES (follow all strictly):
1. Keep the message between 100–350 characters — WhatsApp users prefer concise messages.
2. Use *bold* for key words/phrases (WhatsApp markdown: wrap in asterisks).
3. Use 2–4 relevant emojis placed naturally — never at every sentence.
4. End with ONE clear, action-oriented CTA: reply "YES", tap the link, call us, visit us, etc.
5. Write in a warm, human tone. No corporate jargon or formal letter structure.
6. NO hashtags — WhatsApp is not a social feed.
7. NO line breaks unless genuinely needed for readability.
8. NEVER start with "Dear Customer", "We are pleased", or any generic opener.
9. The message should feel like it's from a real person, not an automated system.

Output ONLY the message text. No preamble, explanation, or quotes around it.`;

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.88,
      max_tokens: 220,
    });

    const content = completion.choices?.[0]?.message?.content?.trim() ?? "";

    if (!content) {
      return Response.json({ success: false, error: "AI returned empty content" }, { status: 500 });
    }

    return Response.json({ success: true, content });
  } catch (err: any) {
    console.error("[whatsapp-content] error:", err);
    return Response.json({ success: false, error: err.message ?? "AI generation failed" }, { status: 500 });
  }
}
