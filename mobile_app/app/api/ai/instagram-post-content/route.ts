import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(params: {
  topic: string;
  accountName: string;
  businessCategory: string;
  tone: string;
  keywords: string[];
}): string {
  const { topic, accountName, businessCategory, tone, keywords } = params;
  const kwList = keywords.length > 0 ? `\nExtra keywords to include naturally: ${keywords.join(", ")}` : "";

  return `You are an expert Instagram marketing copywriter who creates highly engaging captions for business accounts.

Write an Instagram caption for the following:

Topic: "${topic}"
Account Name: ${accountName}
Business Category: ${businessCategory}
Tone: ${tone}${kwList}

INSTAGRAM RULES (follow all):
1. Start with an engaging first line — Instagram collapses text after ~125 characters without "more".
2. Keep the caption body between 150–300 characters (excluding hashtags).
3. Add 10–20 relevant hashtags at the end on a new line, starting with the most specific.
4. Use 3–6 emojis placed naturally throughout — NOT all at the start.
5. Include ONE clear CTA: "Comment below", "Save this", "Tag a friend", "Link in bio", "DM us", etc.
6. Write in a fresh, human voice. Avoid corporate jargon.
7. NEVER start with "Are you looking", "We are", or a generic question.
8. No bullet points in body — conversational paragraph only.

Output ONLY the caption text (body + hashtags). No preamble, no quotes around it.`;
}

function extractHashtags(content: string): string[] {
  return (content.match(/#\w+/g) ?? []).map((h) => h.toLowerCase());
}

function computeEngagementScore(params: {
  content: string;
  topic: string;
  accountName: string;
}): { score: number; tips: string[] } {
  const { content, topic, accountName } = params;
  const lower = content.toLowerCase();
  const tips: string[] = [];
  let score = 0;

  // 1. Hook quality — first line (15 pts)
  const firstLine = content.split("\n")[0]?.toLowerCase() ?? "";
  const boringOpeners = ["are you", "looking for", "we are", "at " + accountName.toLowerCase(), "in today", "hello ", "hi ", "hey "];
  const hasBadOpener = boringOpeners.some((o) => firstLine.startsWith(o));
  if (!hasBadOpener && firstLine.length > 10) {
    score += 15;
  } else {
    tips.push("Rewrite the opening line — avoid generic starters like 'Are you' or 'We are'");
  }

  // 2. Topic keyword in first 80 chars (15 pts)
  const firstChars = lower.slice(0, 80);
  const topicWords = topic.toLowerCase().split(" ").filter((w) => w.length > 3);
  const topicInHook = topicWords.some((w) => firstChars.includes(w));
  if (topicInHook) {
    score += 15;
  } else {
    tips.push("Include your topic keyword in the opening hook for better discoverability");
  }

  // 3. Has a CTA (20 pts)
  const ctaPhrases = [
    "comment below", "leave a comment", "tag a friend", "save this", "share this",
    "link in bio", "dm us", "message us", "sign up", "book now", "shop now",
    "order now", "learn more", "check out", "follow us", "double tap",
    "swipe up", "click the link", "visit us", "drop a",
  ];
  const hasCTA = ctaPhrases.some((p) => lower.includes(p));
  if (hasCTA) {
    score += 20;
  } else {
    tips.push("Add a CTA — e.g. 'Comment below', 'Tag a friend', 'Save this post'");
  }

  // 4. Hashtag count: 10–20 is optimal for Instagram (20 pts)
  const hashtags = extractHashtags(content);
  if (hashtags.length >= 10 && hashtags.length <= 20) {
    score += 20;
  } else if (hashtags.length >= 5 && hashtags.length < 10) {
    score += 10;
    tips.push("Add more hashtags — 10–20 specific hashtags maximise Instagram reach");
  } else if (hashtags.length > 20) {
    score += 10;
    tips.push("Too many hashtags — 10–20 is the sweet spot for Instagram engagement");
  } else {
    tips.push("Add 10–20 relevant hashtags to significantly boost your reach");
  }

  // 5. Emoji presence (10 pts)
  const emojiCount = (content.match(/\p{Emoji}/gu) ?? []).filter((e) => e !== "#").length;
  if (emojiCount >= 3 && emojiCount <= 6) {
    score += 10;
  } else if (emojiCount > 0) {
    score += 5;
    tips.push("Use 3–6 emojis for optimal Instagram engagement");
  } else {
    tips.push("Add 3–6 emojis to make your caption more visually appealing");
  }

  // 6. Caption length: 150–300 chars body (10 pts)
  const bodyText = content.replace(/#\w+/g, "").trim();
  const charCount = bodyText.length;
  if (charCount >= 150 && charCount <= 300) {
    score += 10;
  } else if (charCount < 150) {
    tips.push("Caption body is too short — aim for 150–300 characters for better engagement");
    score += 5;
  } else {
    tips.push("Caption body is long — Instagram users skim, consider trimming to 300 chars");
    score += 7;
  }

  // 7. Total char count under 2200 (10 pts)
  if (content.length <= 2200) {
    score += 10;
  } else {
    tips.push("Total caption exceeds Instagram's 2,200 character limit — shorten it");
  }

  return { score: Math.min(100, score), tips };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic,
      accountName = "our account",
      businessCategory = "",
      tone = "Friendly",
      keywords = [],
    } = body as {
      topic: string;
      accountName?: string;
      businessCategory?: string;
      tone?: string;
      keywords?: string[];
    };

    if (!topic?.trim()) {
      return Response.json({ success: false, error: "topic is required" }, { status: 400 });
    }

    const prompt = buildPrompt({ topic, accountName, businessCategory, tone, keywords });

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 450,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    const content = raw.replace(/^["']|["']$/g, "").trim();

    if (!content) {
      return Response.json({ success: false, error: "AI returned empty content" }, { status: 500 });
    }

    const { score, tips } = computeEngagementScore({ content, topic, accountName });
    const hashtags = extractHashtags(content);

    const suggestedKeywords = [
      topic, accountName, businessCategory, ...keywords,
    ]
      .flatMap((s) => s.split(/[\s,]+/))
      .map((w) => w.toLowerCase().trim().replace(/[^a-z0-9]/g, ""))
      .filter((w) => w.length > 3 && !content.toLowerCase().includes(w))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6);

    return Response.json({
      success: true,
      content,
      seoScore: score,
      tips,
      hashtags,
      suggestedKeywords,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      charCount: content.length,
    });
  } catch (err: any) {
    console.error("[instagram-post-content] error:", err);
    return Response.json({ success: false, error: err.message ?? "AI generation failed" }, { status: 500 });
  }
}
