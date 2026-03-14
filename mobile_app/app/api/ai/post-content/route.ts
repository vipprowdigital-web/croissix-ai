// mobile_app\app\api\ai\post-content\route.ts

//
// Generates an SEO-optimised Google Business Profile post body from:
//   • title          — user's post topic/title
//   • postType       — STANDARD | EVENT | OFFER
//   • businessName   — GBP location name
//   • businessCategory — e.g. "Music School", "Restaurant"
//   • keywords       — optional extra keywords to weave in
//   • existingPosts  — short snippets of recent posts to avoid duplicate phrasing
//   • tone           — Professional | Friendly | Enthusiastic
//
// Returns:
//   { success, content, keywords, seoScore, tips }
//
// SEO principles applied:
//   1. Business name mentioned once naturally (not spammy)
//   2. Primary keyword from title in first sentence
//   3. Local intent phrase ("in [city]" or "near you") if city known
//   4. CTA verb woven in (visit, call, book, discover)
//   5. Hashtags — 3-5 relevant, not generic spam
//   6. Emoji for engagement (proven +18% CTR on GBP)
//   7. Under 1500 chars (GBP limit)
//   8. No duplicate opening phrases vs recent posts
//
// Deploy to: mobile_app/app/api/ai/post-content/route.ts

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── build the prompt ──────────────────────────────────────────────── */
function buildPrompt(params: {
  title:            string;
  postType:         string;
  businessName:     string;
  businessCategory: string;
  keywords:         string[];
  existingOpenings: string[];   // first 8 words of recent posts to avoid
  tone:             string;
  city?:            string;
}): string {
  const { title, postType, businessName, businessCategory, keywords, existingOpenings, tone, city } = params;

  const typeGuide = {
    STANDARD: "a business update or announcement post",
    EVENT:    "an event promotion post that builds excitement and urgency",
    OFFER:    "a promotional offer post with clear value and urgency",
  }[postType] ?? "a business post";

  const avoidList = existingOpenings.length > 0
    ? `\n\nIMPORTANT — Do NOT start with any of these opening phrases (already used in recent posts):\n${existingOpenings.map(o => `- "${o}"`).join("\n")}`
    : "";

  const kwList = keywords.length > 0
    ? `\nExtra keywords to weave in naturally (don't stuff): ${keywords.join(", ")}`
    : "";

  const cityHint = city ? `\nThe business is located in ${city} — include a local reference naturally once.` : "";

  return `You are an expert Google Business Profile SEO copywriter.

Write ${typeGuide} for the following business.

Post Title / Topic: "${title}"
Business Name: ${businessName}
Business Category: ${businessCategory}
Tone: ${tone}${kwList}${cityHint}${avoidList}

SEO RULES (follow all):
1. Mention "${businessName}" exactly ONCE and naturally — not in the first word.
2. Use the post title topic as the primary keyword — include it or a close variation in the FIRST sentence.
3. Include ONE local CTA phrase: "visit us", "book now", "call us", or "come in today".
4. Add 3–5 relevant hashtags at the end. Make them specific (e.g. #MusicLessons not just #Music).
5. Use 2–4 emojis placed naturally, not all at the start.
6. Keep the body under 200 words (Google shows ~300 chars before "more").
7. NEVER start with "Are you", "Looking for", "We are", "At [Business]", or a question.
8. Write with a fresh opening that hasn't been used — be creative with the hook.
9. No filler phrases like "In today's world", "In this fast-paced world".
10. No bullet points — write in flowing paragraph(s).

Output ONLY the post body text. No preamble, no "Here is your post:", no quotes around it. Just the post.`;
}

/* ── extract hashtags ──────────────────────────────────────────────── */
function extractHashtags(content: string): string[] {
  return (content.match(/#\w+/g) ?? []).map(h => h.toLowerCase());
}

/* ── SEO score (0–100) ─────────────────────────────────────────────── */
function computeSEOScore(params: {
  content:      string;
  businessName: string;
  title:        string;
  postType:     string;
}): { score: number; tips: string[] } {
  const { content, businessName, title } = params;
  const lower  = content.toLowerCase();
  const tips: string[] = [];
  let score = 0;

  // 1. Business name mentioned (15pts)
  const nameCount = (content.match(new RegExp(businessName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) ?? []).length;
  if (nameCount === 1) { score += 15; }
  else if (nameCount === 0) { tips.push("Mention your business name once"); }
  else if (nameCount > 2) { tips.push("Business name mentioned too many times — feels spammy"); }
  else { score += 8; }

  // 2. Title keyword in first 50 chars (20pts)
  const firstWords = lower.slice(0, 50);
  const titleWords = title.toLowerCase().split(" ").filter(w => w.length > 3);
  const titleInOpening = titleWords.some(w => firstWords.includes(w));
  if (titleInOpening) { score += 20; }
  else { tips.push("Include your post topic in the opening sentence"); }

  // 3. Has hashtags (15pts)
  const hashtags = extractHashtags(content);
  if (hashtags.length >= 3 && hashtags.length <= 6) { score += 15; }
  else if (hashtags.length > 0) { score += 8; tips.push("Use 3–5 hashtags for best discoverability"); }
  else { tips.push("Add 3–5 relevant hashtags"); }

  // 4. Has CTA (20pts)
  const ctaPhrases = ["visit us","book now","call us","come in","order now","sign up","learn more","shop now","get yours","reserve","contact us","find us","stop by"];
  const hasCTA = ctaPhrases.some(p => lower.includes(p));
  if (hasCTA) { score += 20; }
  else { tips.push("Add a clear call-to-action (e.g. 'Visit us today')"); }

  // 5. Has emojis (10pts)
  const emojiCount = (content.match(/\p{Emoji}/gu) ?? []).filter(e => e !== "#").length;
  if (emojiCount >= 2 && emojiCount <= 5) { score += 10; }
  else if (emojiCount === 1) { score += 5; tips.push("Add 2–4 emojis to boost engagement"); }
  else if (emojiCount > 5) { score += 5; tips.push("Reduce emojis — 2–4 is optimal"); }
  else { tips.push("Add 2–4 emojis to improve click-through rate"); }

  // 6. Length check (10pts)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 50 && wordCount <= 200) { score += 10; }
  else if (wordCount < 50) { tips.push("Post is too short — aim for 60–150 words"); }
  else { tips.push("Post is very long — consider trimming to under 200 words"); }

  // 7. No spammy repetition (10pts)
  const words   = lower.split(/\s+/);
  const wordFreq: Record<string, number> = {};
  words.forEach(w => { if (w.length > 4) wordFreq[w] = (wordFreq[w] ?? 0) + 1; });
  const spammy  = Object.values(wordFreq).some(c => c > 4);
  if (!spammy) { score += 10; }
  else { tips.push("Some words are repeated too often — vary your language"); }

  return { score: Math.min(100, score), tips };
}

/* ══════════════════════════════════════════════════════════
   POST handler
══════════════════════════════════════════════════════════ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      postType        = "STANDARD",
      businessName    = "our business",
      businessCategory= "",
      keywords        = [],
      existingPosts   = [],          // array of recent post bodies
      tone            = "Friendly",
      city,
    } = body as {
      title:            string;
      postType?:        string;
      businessName?:    string;
      businessCategory?:string;
      keywords?:        string[];
      existingPosts?:   string[];
      tone?:            string;
      city?:            string;
    };

    if (!title?.trim()) {
      return Response.json({ success: false, error: "title is required" }, { status: 400 });
    }

    /* extract opening phrases from existing posts to avoid duplication */
    const existingOpenings = existingPosts
      .map(p => p.trim().split(/\s+/).slice(0, 7).join(" "))
      .filter(Boolean)
      .slice(0, 8);

    const prompt = buildPrompt({
      title, postType, businessName, businessCategory,
      keywords, existingOpenings, tone, city,
    });

    const completion = await groq.chat.completions.create({
      model:       process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens:  400,
    });

    const raw     = completion.choices?.[0]?.message?.content?.trim() ?? "";
    // strip any accidental leading/trailing quotes the model adds
    const content = raw.replace(/^["']|["']$/g, "").trim();

    if (!content) {
      return Response.json({ success: false, error: "AI returned empty content" }, { status: 500 });
    }

    const { score, tips } = computeSEOScore({ content, businessName, title, postType });
    const hashtags         = extractHashtags(content);

    /* suggest keywords not already in the content for the UI keyword chip panel */
    const suggestedKeywords = [
      title, businessName, businessCategory,
      ...(keywords ?? []),
    ]
      .flatMap(s => s.split(/[\s,]+/))
      .map(w => w.toLowerCase().trim().replace(/[^a-z0-9]/g, ""))
      .filter(w => w.length > 3 && !content.toLowerCase().includes(w))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6);

    return Response.json({
      success:   true,
      content,
      seoScore:  score,
      tips,
      hashtags,
      suggestedKeywords,
      wordCount: content.split(/\s+/).length,
      charCount: content.length,
    });

  } catch (err: any) {
    console.error("[post-content] error:", err);
    return Response.json({ success: false, error: err.message ?? "AI generation failed" }, { status: 500 });
  }
}