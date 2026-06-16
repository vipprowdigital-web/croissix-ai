// mobile_app/app/api/ai/facebook-generate-image/route.ts
//
// Generates a high-quality image for a Facebook Page post.
//
// Strategy:
//   PRIMARY   → Pollinations.ai (free, no API key, FLUX model)
//               GET https://gen.pollinations.ai/image/{encoded_prompt}?...
//               Returns image directly as binary — we fetch it, convert to base64, return as data URL
//
//   FALLBACK  → Together AI (FLUX.1-schnell, requires TOGETHER_API_KEY env var)
//               POST https://api.together.xyz/v1/images/generations
//               Returns base64 image data
//
// Prompt engineering:
//   The route builds a scroll-stopping visual prompt from:
//     • topic / title
//     • postType  (STANDARD | EVENT | OFFER | PROMOTIONAL)
//     • pageName + businessCategory
//     • style override from user
//     • imageFormat (feed | square | story)
//
// Request body:
//   { topic, postType, pageName, businessCategory, content?, style?, imageFormat?, seed? }
//
// Response:
//   { success, imageUrl (data:image/png;base64,...), prompt, provider, seed, dimensions }
//
// Facebook image dimensions used:
//   feed   → 1200 × 630  (1.91:1 — standard Facebook feed post)
//   square → 1080 × 1080 (1:1   — high engagement on mobile feed)
//   story  → 1080 × 1920 (9:16  — Facebook Stories / Reels cover)

/* ── Image format → pixel dimensions ─────────────────────────────── */
const IMAGE_FORMATS: Record<string, { width: number; height: number; label: string }> = {
  feed:   { width: 1200, height: 630,  label: "Facebook feed post (1.91:1)" },
  square: { width: 1080, height: 1080, label: "square Facebook post (1:1)" },
  story:  { width: 1080, height: 1920, label: "Facebook Story / Reel cover (9:16)" },
};

/* ── Post-type base scenes ────────────────────────────────────────── */
const POST_TYPE_SCENES: Record<string, string> = {
  STANDARD:    "lifestyle brand marketing scene, organic and relatable social media aesthetic",
  EVENT:       "vibrant event atmosphere, people celebrating, dynamic energy, party or gathering vibe",
  OFFER:       "bold promotional composition, sale or deal concept, eye-catching commercial layout",
  PROMOTIONAL: "product showcase marketing visual, aspirational lifestyle, clean brand photography",
};

/* ── Visual style modifiers ───────────────────────────────────────── */
const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic: "photorealistic DSLR photography, natural lighting, depth of field, true-to-life colours",
  illustration:   "modern digital illustration, vibrant flat design, bold lines, graphic design aesthetic",
  minimalist:     "minimalist photography, clean white or neutral background, product-focused, studio lighting",
  cinematic:      "cinematic photography, moody dramatic lighting, film-quality composition, rich tones",
  warm:           "warm golden-hour photography, cosy lifestyle atmosphere, sun-kissed tones, inviting feel",
  bold:           "bold vivid colours, high contrast, graphic punch, social-media-scroll-stopping visual",
};

/* ── Prompt builder ───────────────────────────────────────────────── */
function buildImagePrompt(params: {
  topic:            string;
  content:          string;
  postType:         string;
  pageName:         string;
  businessCategory: string;
  style:            string;
  imageFormat:      string;
}): string {
  const { topic, content, postType, pageName, businessCategory, style, imageFormat } = params;

  const cleanTopic = topic.replace(/[^a-zA-Z0-9\s]/g, "").trim();

  const contentKeywords = content
    .replace(/[#*@]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 10)
    .join(" ");

  const category  = businessCategory || "local business";
  const styleMod  = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.photorealistic;
  const scene     = POST_TYPE_SCENES[postType] ?? POST_TYPE_SCENES.STANDARD;
  const { label } = IMAGE_FORMATS[imageFormat] ?? IMAGE_FORMATS.feed;

  const textInstruction = cleanTopic
    ? `if any text appears in the image, it must be limited to the word or phrase "${cleanTopic}" spelled correctly and legibly — absolutely no gibberish, random characters, misspelled words, garbled letters, or nonsensical text anywhere in the image`
    : `if any text appears in the image it must be spelled correctly and legibly — absolutely no gibberish, random characters, misspelled words, garbled letters, or nonsensical text anywhere in the image`;

  return `
    scroll-stopping Facebook post image for "${pageName}",
    ${category} brand,
    topic: ${cleanTopic},
    context clues: ${contentKeywords},

    visual scene:
    ${scene} related to ${category},

    composition:
    visually dominant subject centred or rule-of-thirds,
    uncluttered background that supports the subject,
    optimised for mobile Facebook feed viewing,

    style:
    ${styleMod},

    text accuracy rule (critical):
    ${textInstruction},
    prefer images with no text overlay at all — let the visuals speak,
    if text must appear keep it minimal and ensure every letter is a real correctly spelled English word,

    format:
    ${label},
    high-resolution social media marketing image,

    no watermarks,
    no random characters,
    no garbled or misspelled text,
    no logos,
    high quality commercial photography
  `.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();
}

/* ── Pollinations AI (free, no key) ──────────────────────────────── */
async function generateWithPollinations(
  prompt: string,
  seed: number,
  width: number,
  height: number,
): Promise<string> {
  console.log("[fb-generate-image][pollinations] start");

  const encoded = encodeURIComponent(prompt);
  const url =
    `https://gen.pollinations.ai/image/${encoded}` +
    `?model=flux&width=${width}&height=${height}&seed=${seed}&enhance=true`;

  let res: Response | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
          Accept: "image/*",
        },
        signal: AbortSignal.timeout(90_000),
      });

      if (res.ok) break;
      console.warn(`[fb-generate-image][pollinations] attempt ${attempt} non-200: ${res.status}`);
    } catch (err) {
      console.error(`[fb-generate-image][pollinations] attempt ${attempt} error:`, err);
    }

    await new Promise(r => setTimeout(r, 1200));
  }

  if (!res || !res.ok) {
    throw new Error(`Pollinations failed after retries (${res?.status})`);
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer      = await res.arrayBuffer();
  const b64         = Buffer.from(buffer).toString("base64");

  return `data:${contentType};base64,${b64}`;
}

/* ── Together AI (FLUX.1-schnell, requires key) ──────────────────── */
async function generateWithTogether(
  prompt: string,
  seed: number,
  width: number,
  height: number,
): Promise<string> {
  console.log("[fb-generate-image][together] start");

  const key = process.env.TOGETHER_API_KEY;
  if (!key) throw new Error("TOGETHER_API_KEY not set");

  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:           "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width,
      height,
      steps:           4,
      seed,
      n:               1,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? `Together API ${res.status}`);

  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("Together API: no image data returned");

  return `data:image/png;base64,${b64}`;
}

/* ══════════════════════════════════════════════════════════
   POST handler
══════════════════════════════════════════════════════════ */
export async function POST(req: Request) {
  console.log("[fb-generate-image] request");
  try {
    const body = await req.json();
    const {
      topic,
      content          = "",
      postType         = "STANDARD",
      pageName         = "",
      businessCategory = "",
      style            = "photorealistic",
      imageFormat      = "feed",
      seed             = Math.floor(Math.random() * 999_999),
    } = body as {
      topic:             string;
      content?:          string;
      postType?:         string;
      pageName?:         string;
      businessCategory?: string;
      style?:            string;
      imageFormat?:      string;
      seed?:             number;
    };

    if (!topic?.trim()) {
      return Response.json({ success: false, error: "topic is required" }, { status: 400 });
    }

    const format     = IMAGE_FORMATS[imageFormat] ?? IMAGE_FORMATS.feed;
    const { width, height } = format;

    const prompt = buildImagePrompt({
      topic, content, postType, pageName, businessCategory, style, imageFormat,
    });

    let imageUrl: string;
    let provider: string;

    try {
      imageUrl = await generateWithPollinations(prompt, seed, width, height);
      provider = "pollinations";
      console.log("[fb-generate-image] pollinations OK");
    } catch (polErr: any) {
      console.warn("[fb-generate-image] pollinations failed:", polErr.message, "— trying Together AI");
      try {
        imageUrl = await generateWithTogether(prompt, seed, width, height);
        provider = "together";
        console.log("[fb-generate-image] together OK");
      } catch (toErr: any) {
        console.error("[fb-generate-image] both providers failed:", toErr.message);
        return Response.json(
          {
            success: false,
            error:   `Image generation failed: ${toErr.message}. Add TOGETHER_API_KEY to .env for reliable generation.`,
          },
          { status: 500 },
        );
      }
    }

    return Response.json({
      success:    true,
      imageUrl,
      prompt,
      provider,
      seed,
      dimensions: { width, height, format: imageFormat, label: format.label },
    });

  } catch (err: any) {
    console.error("[fb-generate-image] error:", err);
    return Response.json(
      { success: false, error: err.message ?? "Image generation failed" },
      { status: 500 },
    );
  }
}
