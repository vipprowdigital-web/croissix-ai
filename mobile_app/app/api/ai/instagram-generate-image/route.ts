// Instagram image generation — square 1080×1080 format (primary Instagram feed format)
// Uses the same dual-provider strategy: Pollinations (free) → Together AI (fallback)

const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic: "photorealistic DSLR photography, natural lighting, depth of field, true-to-life colours",
  illustration:   "modern digital illustration, vibrant flat design, bold lines, graphic design aesthetic",
  minimalist:     "minimalist photography, clean white or neutral background, product-focused, studio lighting, elegant",
  cinematic:      "cinematic photography, moody dramatic lighting, film-quality composition, rich tones",
  warm:           "warm golden-hour photography, cosy lifestyle atmosphere, sun-kissed tones, inviting feel",
};

function buildImagePrompt(params: {
  topic: string;
  caption: string;
  accountName: string;
  businessCategory: string;
  style: string;
}): string {
  const { topic, caption, accountName, businessCategory, style } = params;

  const cleanTopic = topic.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const category   = businessCategory || "lifestyle brand";
  const styleMod   = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.photorealistic;

  const captionKeywords = caption
    .replace(/[#*@]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 8)
    .join(" ");

  const textInstruction = cleanTopic
    ? `if any text appears in the image, it must be limited to "${cleanTopic}" spelled correctly — absolutely no gibberish, garbled letters, or misspelled text`
    : `absolutely no text overlays — prefer a clean visual with no text`;

  return `
    scroll-stopping Instagram feed post image for "${accountName}",
    ${category} brand,
    topic: ${cleanTopic || "lifestyle"},
    context: ${captionKeywords},

    visual composition:
    visually dominant subject, rule-of-thirds or centred,
    clean uncluttered background that supports the subject,
    optimised for square Instagram feed viewing,
    highly aesthetic, Instagram-worthy visual quality,

    style: ${styleMod},

    text rule (critical): ${textInstruction},
    prefer images with no text overlay — let the visuals tell the story,

    format: 1080×1080 square Instagram post,
    high-resolution social media photography,

    no watermarks, no logos, no garbled text, no random characters,
    high quality commercial photography
  `.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim();
}

async function generateWithPollinations(prompt: string, seed: number): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const url =
    `https://gen.pollinations.ai/image/${encoded}` +
    `?model=flux&width=1080&height=1080&seed=${seed}&enhance=true`;

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
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  if (!res || !res.ok) throw new Error(`Pollinations failed (${res?.status})`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer      = await res.arrayBuffer();
  const b64         = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${b64}`;
}

async function generateWithTogether(prompt: string, seed: number): Promise<string> {
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
      width:           1080,
      height:          1080,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic            = "",
      caption          = "",
      accountName      = "",
      businessCategory = "",
      style            = "photorealistic",
      seed             = Math.floor(Math.random() * 999_999),
    } = body as {
      topic?:            string;
      caption?:          string;
      accountName?:      string;
      businessCategory?: string;
      style?:            string;
      seed?:             number;
    };

    if (!topic?.trim()) {
      return Response.json({ success: false, error: "topic is required" }, { status: 400 });
    }

    const prompt = buildImagePrompt({ topic, caption, accountName, businessCategory, style });

    let imageUrl: string;
    let provider: string;

    try {
      imageUrl = await generateWithPollinations(prompt, seed);
      provider = "Pollinations";
    } catch (polErr: any) {
      console.warn("[ig-generate-image] pollinations failed:", polErr.message);
      try {
        imageUrl = await generateWithTogether(prompt, seed);
        provider = "Together AI";
      } catch (toErr: any) {
        return Response.json(
          { success: false, error: `Image generation failed: ${toErr.message}` },
          { status: 500 },
        );
      }
    }

    return Response.json({ success: true, imageUrl, prompt, provider, seed });
  } catch (err: any) {
    console.error("[ig-generate-image] error:", err);
    return Response.json({ success: false, error: err.message ?? "Image generation failed" }, { status: 500 });
  }
}
