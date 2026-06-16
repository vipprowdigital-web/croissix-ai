// mobile_app/app/api/ai/facebook-post-content/route.ts
//
// Generates an engagement-optimised Facebook Page post from:
//   • topic            — post subject / title
//   • postType         — STANDARD | EVENT | OFFER | PROMOTIONAL
//   • pageName         — Facebook Page name
//   • businessCategory — e.g. "Music School", "Restaurant"
//   • keywords         — optional extra keywords to weave in
//   • existingPosts    — recent post bodies to avoid duplicate phrasing
//   • tone             — Professional | Friendly | Enthusiastic | Casual | Inspirational
//   • targetAudience   — optional, e.g. "young professionals", "parents"
//
// Returns:
//   { success, content, engagementScore, tips, hashtags, suggestedKeywords, wordCount, charCount }
//
// Facebook best-practice rules applied:
//   1. Hook in the first line — Facebook truncates after ~3 lines ("See more")
//   2. Optimal length: 40–80 words (highest organic reach on Facebook)
//   3. 1–3 hashtags only — Facebook does NOT boost posts with many hashtags
//   4. CTA woven in naturally (comment, share, tag a friend, book now, etc.)
//   5. 2–4 emojis for visual warmth and engagement
//   6. No duplicate opening phrases vs recent posts
//   7. Conversational tone that invites interaction (likes, comments, shares)

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── build the prompt ──────────────────────────────────────────────── */
function buildPrompt(params: {
  topic:            string;
  postType:         string;
  pageName:         string;
  businessCategory: string;
  keywords:         string[];
  existingOpenings: string[];
  tone:             string;
  targetAudience?:  string;
}): string {
  const { topic, postType, pageName, businessCategory, keywords, existingOpenings, tone, targetAudience } = params;

  const typeGuide = {
    STANDARD:    "a regular Facebook Page post that sparks engagement (likes, comments, shares)",
    EVENT:       "a Facebook event promotion post that builds excitement and drives RSVPs",
    OFFER:       "a Facebook promotional offer post with clear value and a sense of urgency",
    PROMOTIONAL: "a promotional Facebook post highlighting a product, service, or deal",
  }[postType] ?? "a Facebook Page post";

  const avoidList = existingOpenings.length > 0
    ? `\n\nIMPORTANT — Do NOT start with any of these opening phrases (already used in recent posts):\n${existingOpenings.map(o => `- "${o}"`).join("\n")}`
    : "";

  const kwList = keywords.length > 0
    ? `\nExtra keywords to weave in naturally (don't stuff): ${keywords.join(", ")}`
    : "";

  const audienceHint = targetAudience
    ? `\nTarget audience: ${targetAudience} — write in a way that resonates with them.`
    : "";

  return `You are an expert Facebook marketing copywriter who specialises in organic reach and engagement for business pages.

Write ${typeGuide} for the following page.

Post Topic: "${topic}"
Page Name: ${pageName}
Business Category: ${businessCategory}
Tone: ${tone}${kwList}${audienceHint}${avoidList}

FACEBOOK RULES (follow all):
1. Open with a strong hook in the FIRST line — Facebook collapses text after ~3 lines, so the hook must make people tap "See more".
2. Mention "${pageName}" at most ONCE and only if it flows naturally — never in the opening word.
3. Keep the body between 40 and 80 words — this length gets the highest organic Facebook reach.
4. Add exactly 1–3 relevant hashtags at the end. DO NOT add more than 3 (Facebook demotes posts with hashtag spam).
5. Use 2–4 emojis placed naturally throughout — NOT all at the start.
6. Include ONE clear CTA that invites interaction: "Drop a comment", "Tag a friend", "Share this", "Book now", "DM us", etc.
7. NEVER start with "Are you looking", "We are", "At ${pageName}", "In today's world", or a generic question.
8. Write in a fresh, human voice. Avoid corporate jargon and filler phrases.
9. No bullet points — flowing paragraph(s) only.
10. Do NOT include a link — the caller handles link attachment separately.

Output ONLY the post body text. No preamble, no "Here is your post:", no quotes around it. Just the post.`;
}

/* ── extract hashtags ──────────────────────────────────────────────── */
function extractHashtags(content: string): string[] {
  return (content.match(/#\w+/g) ?? []).map(h => h.toLowerCase());
}

/* ── engagement score (0–100) ─────────────────────────────────────── */
function computeEngagementScore(params: {
  content:  string;
  pageName: string;
  topic:    string;
  postType: string;
}): { score: number; tips: string[] } {
  const { content, pageName, topic } = params;
  const lower    = content.toLowerCase();
  const tips: string[] = [];
  let score = 0;

  // 1. Hook quality — first line should not be generic (15 pts)
  const firstLine = content.split("\n")[0]?.toLowerCase() ?? "";
  const boringOpeners = ["are you", "looking for", "we are", "at " + pageName.toLowerCase(), "in today", "hello ", "hi ", "hey "];
  const hasBadOpener  = boringOpeners.some(o => firstLine.startsWith(o));
  if (!hasBadOpener && firstLine.length > 10) { score += 15; }
  else { tips.push("Rewrite the opening hook — avoid generic starters like 'Are you' or 'We are'"); }

  // 2. Topic keyword in first 60 chars (15 pts)
  const firstChars  = lower.slice(0, 60);
  const topicWords  = topic.toLowerCase().split(" ").filter(w => w.length > 3);
  const topicInHook = topicWords.some(w => firstChars.includes(w));
  if (topicInHook) { score += 15; }
  else { tips.push("Include your post topic in the opening hook"); }

  // 3. Page name mentioned at most once (10 pts)
  const nameCount = (content.match(new RegExp(pageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) ?? []).length;
  if (nameCount <= 1) { score += 10; }
  else { tips.push("Mentioning your page name more than once feels promotional — keep it to once"); }

  // 4. Has a CTA (20 pts)
  const ctaPhrases = [
    "drop a comment", "leave a comment", "comment below", "tag a friend", "share this",
    "book now", "dm us", "message us", "sign up", "click the link", "visit us",
    "call us", "shop now", "order now", "learn more", "find out more", "reserve",
    "get yours", "grab yours", "join us", "rsvp",
  ];
  const hasCTA = ctaPhrases.some(p => lower.includes(p));
  if (hasCTA) { score += 20; }
  else { tips.push("Add a clear CTA — e.g. 'Drop a comment', 'Tag a friend', or 'Book now'"); }

  // 5. Hashtag count: 1–3 is optimal for Facebook (15 pts)
  const hashtags = extractHashtags(content);
  if (hashtags.length >= 1 && hashtags.length <= 3) { score += 15; }
  else if (hashtags.length === 0) { tips.push("Add 1–3 relevant hashtags"); }
  else { tips.push("Too many hashtags — Facebook limits reach when you use more than 3"); score += 5; }

  // 6. Emoji presence (10 pts)
  const emojiCount = (content.match(/\p{Emoji}/gu) ?? []).filter(e => e !== "#").length;
  if (emojiCount >= 2 && emojiCount <= 4) { score += 10; }
  else if (emojiCount === 1) { score += 5; tips.push("Add 2–4 emojis to boost warmth and engagement"); }
  else if (emojiCount > 4) { score += 5; tips.push("Too many emojis — 2–4 is the sweet spot"); }
  else { tips.push("Add 2–4 emojis to improve engagement"); }

  // 7. Length: 40–80 words is Facebook's engagement sweet spot (15 pts)
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 40 && wordCount <= 80) { score += 15; }
  else if (wordCount < 40) { tips.push("Post is too short — aim for 40–80 words for best Facebook reach"); score += 5; }
  else { tips.push("Post is long — Facebook reach drops past 80 words; consider trimming"); score += 8; }

  return { score: Math.min(100, score), tips };
}

/* ══════════════════════════════════════════════════════════
   POST handler
══════════════════════════════════════════════════════════ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic,
      postType         = "STANDARD",
      pageName         = "our page",
      businessCategory = "",
      keywords         = [],
      existingPosts    = [],
      tone             = "Friendly",
      targetAudience,
    } = body as {
      topic:             string;
      postType?:         string;
      pageName?:         string;
      businessCategory?: string;
      keywords?:         string[];
      existingPosts?:    string[];
      tone?:             string;
      targetAudience?:   string;
    };

    if (!topic?.trim()) {
      return Response.json({ success: false, error: "topic is required" }, { status: 400 });
    }

    const existingOpenings = existingPosts
      .map(p => p.trim().split(/\s+/).slice(0, 7).join(" "))
      .filter(Boolean)
      .slice(0, 8);

    const prompt = buildPrompt({
      topic, postType, pageName, businessCategory,
      keywords, existingOpenings, tone, targetAudience,
    });

    const completion = await groq.chat.completions.create({
      model:       process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens:  300,
    });

    const raw     = completion.choices?.[0]?.message?.content?.trim() ?? "";
    const content = raw.replace(/^["']|["']$/g, "").trim();

    if (!content) {
      return Response.json({ success: false, error: "AI returned empty content" }, { status: 500 });
    }

    const { score, tips } = computeEngagementScore({ content, pageName, topic, postType });
    const hashtags         = extractHashtags(content);

    const suggestedKeywords = [
      topic, pageName, businessCategory,
      ...(keywords ?? []),
    ]
      .flatMap(s => s.split(/[\s,]+/))
      .map(w => w.toLowerCase().trim().replace(/[^a-z0-9]/g, ""))
      .filter(w => w.length > 3 && !content.toLowerCase().includes(w))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6);

    return Response.json({
      success:          true,
      content,
      engagementScore:  score,
      tips,
      hashtags,
      suggestedKeywords,
      wordCount:        content.split(/\s+/).filter(Boolean).length,
      charCount:        content.length,
    });

  } catch (err: any) {
    console.error("[facebook-post-content] error:", err);
    return Response.json({ success: false, error: err.message ?? "AI generation failed" }, { status: 500 });
  }
}
