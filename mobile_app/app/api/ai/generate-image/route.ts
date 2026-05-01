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
  STANDARD:
    "professional product photography, clean bright background, commercial quality, sharp focus, 4K",
  EVENT:
    "vibrant event poster style, dynamic composition, celebratory atmosphere, bold colours, professional photography",
  OFFER:
    "bold promotional banner style, sale concept, eye-catching composition, commercial photography, bright colours",
};

const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic:
    "photorealistic, DSLR photography, natural lighting, depth of field",
  illustration:
    "digital illustration, modern flat design, vibrant colours, clean lines",
  minimalist:
    "minimalist photography, white background, product-focused, studio lighting, elegant",
  cinematic:
    "cinematic photography, moody lighting, film quality, dramatic composition",
  warm: "warm toned photography, golden hour lighting, cosy atmosphere, lifestyle photography",
};

function buildImagePrompt(params: {
  title: string;
  content: string;
  postType: string;
  businessName: string;
  businessCategory: string;
  style: string;
}): string {
  const { title, content, postType, businessName, businessCategory, style } =
    params;

  const topic = title.replace(/[^a-zA-Z0-9\s]/g, "").trim();

  const contentKeywords = content
    .replace(/[#*]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 10)
    .join(" ");

  const category = businessCategory || "local business";

  const styleMod = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.photorealistic;

  const sceneMap: Record<string, string> = {
    STANDARD: `professional marketing photo representing ${category}`,
    EVENT: `event promotion scene for ${category}, people participating, vibrant atmosphere`,
    OFFER: `promotional sale concept for ${category}, attractive commercial marketing visual`,
  };

  const scene = sceneMap[postType] ?? sceneMap.STANDARD;

  const prompt = `
            brand marketing image for "${businessName}",
            ${category} business promotion,
            topic: ${topic},
            context: ${contentKeywords},

            visual scene:
            ${scene},

            composition:
            center focused subject,
            clean background,
            modern advertising photography,

            style:
            ${styleMod},

            format:
            1200 width x 900 height
            4:3 aspect ratio marketing image,
            professional Google Business Profile post image,

            no watermark,
            no random text,
            high quality commercial photography
            `.replace(/\n/g, " ");

  return prompt;
}

/* ── Pollinations AI (free, no key) ──────────────────────────────── */
async function generateWithPollinations(
  prompt: string,
  seed: number,
): Promise<string> {
  console.log("[pollinations] start");
  // console.log("[pollinations] seed:", seed);

  const encoded = encodeURIComponent(prompt);

  const url =
    `https://gen.pollinations.ai/image/${encoded}` +
    `?model=flux&width=1200&height=675&seed=${seed}&enhance=true`;

  // console.log("[pollinations] url:", url.slice(0, 120));

  let res: Response | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // console.log(`[pollinations] attempt ${attempt}`);

      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
          Accept: "image/*",
        },
        signal: AbortSignal.timeout(90000),
      });

      // console.log("[pollinations] status:", res.status);

      if (res.ok) break;

      console.warn("[pollinations] non-200 response");
    } catch (err) {
      console.error("[pollinations] fetch error:", err);
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  if (!res || !res.ok) {
    throw new Error(`Pollinations failed after retries (${res?.status})`);
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";

  // console.log("[pollinations] content-type:", contentType);

  const buffer = await res.arrayBuffer();

  // console.log("[pollinations] image size:", buffer.byteLength);

  const b64 = Buffer.from(buffer).toString("base64");

  // console.log("[pollinations] base64 length:", b64.length);

  return `data:${contentType};base64,${b64}`;
}

/* ── Together AI (FLUX.1-schnell, requires key) ──────────────────── */
async function generateWithTogether(
  prompt: string,
  seed: number,
): Promise<string> {
  console.log("[together] start");
  // console.log("[together] key exists:", !!process.env.TOGETHER_API_KEY);
  // console.log("[together] seed:", seed);
  // console.log("[together] prompt:", prompt.slice(0, 100));

  const key = process.env.TOGETHER_API_KEY;
  if (!key) throw new Error("TOGETHER_API_KEY not set");

  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width: 1200,
      height: 675,
      steps: 4,
      seed,
      n: 1,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const json = await res.json();
  if (!res.ok)
    throw new Error(json.error?.message ?? `Together API ${res.status}`);

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
      content = "",
      postType = "STANDARD",
      businessName = "",
      businessCategory = "",
      style = "photorealistic",
      seed = Math.floor(Math.random() * 999999),
    } = body as {
      title: string;
      content?: string;
      postType?: string;
      businessName?: string;
      businessCategory?: string;
      style?: string;
      seed?: number;
    };

    if (!title?.trim()) {
      return Response.json(
        { success: false, error: "title is required" },
        { status: 400 },
      );
    }

    const prompt = buildImagePrompt({
      title,
      content,
      postType,
      businessName,
      businessCategory,
      style,
    });
    // console.log("[generate-image] prompt:", prompt.slice(0, 100));

    let imageUrl: string;
    let provider: string;

    // Try Pollinations first (free, no key needed)
    try {
      imageUrl = await generateWithPollinations(prompt, seed);
      provider = "pollinations";
      console.log("[generate-image] pollinations OK");
    } catch (polErr: any) {
      console.warn(
        "[generate-image] pollinations failed:",
        polErr.message,
        "— trying Together AI",
      );
      // Fallback to Together AI
      try {
        imageUrl = await generateWithTogether(prompt, seed);
        provider = "together";
        console.log("[generate-image] together OK");
      } catch (toErr: any) {
        console.error("[generate-image] both providers failed:", toErr.message);
        return Response.json(
          {
            success: false,
            error: `Image generation failed: ${toErr.message}. Add TOGETHER_API_KEY to .env for reliable generation.`,
          },
          { status: 500 },
        );
      }
    }

    return Response.json({
      success: true,
      imageUrl,
      prompt,
      provider,
      seed,
    });
  } catch (err: any) {
    console.error("[generate-image] error:", err);
    return Response.json(
      { success: false, error: err.message ?? "Image generation failed" },
      { status: 500 },
    );
  }
}
