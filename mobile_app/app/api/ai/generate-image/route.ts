// mobile_app\app\api\ai\generate-image\route.ts

// mobile_app/app/api/ai/generate-image/route.ts
//
// Generates a high-quality image for a Google Business Profile post.
//
// Strategy:
//   PRIMARY   → Pollinations.ai (free, no API key, FLUX model)
//               GET https://image.pollinations.ai/prompt/{encoded_prompt}?...
//               Returns image directly as binary — we fetch it, convert to base64, return as data URL
//
//   FALLBACK  → Together AI (FLUX.1-schnell, requires TOGETHER_API_KEY env var)
//               POST https://api.together.xyz/v1/images/generations
//               Returns base64 image data
//
// Prompt engineering:
//   The route builds a rich visual prompt from:
//     • title / topic
//     • postType (STANDARD → clean product shot, EVENT → vibrant event scene, OFFER → bold promo)
//     • businessName + businessCategory
//     • style override from user
//
// Request body:
//   { title, postType, businessName, businessCategory, style?, seed? }
//
// Response:
//   { success, imageUrl (data:image/png;base64,...), prompt, provider, seed }
//
// IMPORTANT — Call this API only when:
//   • title OR postType OR businessName changes (not on description regen)
//   • User explicitly taps "Regenerate Image"
//   The page tracks a `imageKey` hash to prevent redundant calls.
//
// Deploy to: mobile_app/app/api/ai/generate-image/route.ts

const IMAGE_STYLES: Record<string, string> = {
  STANDARD: "professional product photography, clean bright background, commercial quality, sharp focus, 4K",
  EVENT:    "vibrant event poster style, dynamic composition, celebratory atmosphere, bold colours, professional photography",
  OFFER:    "bold promotional banner style, sale concept, eye-catching composition, commercial photography, bright colours",
};

const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic: "photorealistic, DSLR photography, natural lighting, depth of field",
  illustration:   "digital illustration, modern flat design, vibrant colours, clean lines",
  minimalist:     "minimalist photography, white background, product-focused, studio lighting, elegant",
  cinematic:      "cinematic photography, moody lighting, film quality, dramatic composition",
  warm:           "warm toned photography, golden hour lighting, cosy atmosphere, lifestyle photography",
};

function buildImagePrompt(params: {
  title:            string;
  postType:         string;
  businessName:     string;
  businessCategory: string;
  style:            string;
}): string {
  const { title, postType, businessName, businessCategory, style } = params;
  const baseStyle  = IMAGE_STYLES[postType] ?? IMAGE_STYLES.STANDARD;
  const styleMod   = STYLE_MODIFIERS[style]  ?? STYLE_MODIFIERS.photorealistic;

  // Build a visual description, NOT showing text in the image
  const category   = businessCategory || "business";
  const topic      = title.replace(/[^a-zA-Z0-9\s]/g, "").trim();

  const prompt = `${topic}, ${category} concept, ${baseStyle}, ${styleMod}, no text, no words, no letters, no watermark, high quality commercial image, 16:9 aspect ratio`;

  return prompt;
}

/* ── Pollinations AI (free, no key) ──────────────────────────────── */
async function generateWithPollinations(prompt: string, seed: number): Promise<string> {
  const encoded  = encodeURIComponent(prompt);
  const url      = `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=675&model=flux&seed=${seed}&nologo=true&enhance=true`;

  // Pollinations returns the image directly — fetch and convert to base64
  const res      = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Pollinations returned ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("Pollinations did not return an image");

  const buffer   = await res.arrayBuffer();
  const b64      = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${b64}`;
}

/* ── Together AI (FLUX.1-schnell, requires key) ──────────────────── */
async function generateWithTogether(prompt: string, seed: number): Promise<string> {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) throw new Error("TOGETHER_API_KEY not set");

  const res  = await fetch("https://api.together.xyz/v1/images/generations", {
    method:  "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model:           "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width:           1200,
      height:          675,
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
  console.log("[generate-image] request");
  try {
    const body = await req.json();
    const {
      title,
      postType         = "STANDARD",
      businessName     = "",
      businessCategory = "",
      style            = "photorealistic",
      seed             = Math.floor(Math.random() * 999999),
    } = body as {
      title:             string;
      postType?:         string;
      businessName?:     string;
      businessCategory?: string;
      style?:            string;
      seed?:             number;
    };

    if (!title?.trim()) {
      return Response.json({ success: false, error: "title is required" }, { status: 400 });
    }

    const prompt = buildImagePrompt({ title, postType, businessName, businessCategory, style });
    console.log("[generate-image] prompt:", prompt.slice(0, 100));

    let imageUrl: string;
    let provider: string;

    // Try Pollinations first (free, no key needed)
    try {
      imageUrl = await generateWithPollinations(prompt, seed);
      provider = "pollinations";
      console.log("[generate-image] pollinations OK");
    } catch (polErr: any) {
      console.warn("[generate-image] pollinations failed:", polErr.message, "— trying Together AI");
      // Fallback to Together AI
      try {
        imageUrl = await generateWithTogether(prompt, seed);
        provider = "together";
        console.log("[generate-image] together OK");
      } catch (toErr: any) {
        console.error("[generate-image] both providers failed:", toErr.message);
        return Response.json({
          success: false,
          error: `Image generation failed: ${toErr.message}. Add TOGETHER_API_KEY to .env for reliable generation.`,
        }, { status: 500 });
      }
    }

    return Response.json({
      success:  true,
      imageUrl,
      prompt,
      provider,
      seed,
    });

  } catch (err: any) {
    console.error("[generate-image] error:", err);
    return Response.json({ success: false, error: err.message ?? "Image generation failed" }, { status: 500 });
  }
}