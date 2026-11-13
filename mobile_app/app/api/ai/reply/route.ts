// mobile_app\app\api\ai\reply\route.ts

import { generateReviewReply } from "@/lib/aiService";

export async function POST(req: Request) {
  try {
    const {
      review,
      rating,
      reviewerName,
      businessName,
      businessCategory,
      businessLocation,
      businessServices,
      seoKeywords,
      tone,
    } = await req.json();

    // Rating-only reviews go through the same prompt, which has its own
    // "Rating-Only Reviews" rules.
    const reply = await generateReviewReply({
      review: review ?? "",
      rating,
      reviewerName,
      businessName,
      businessCategory,
      businessLocation,
      businessServices,
      seoKeywords,
      tone,
    });

    if (!reply) throw new Error("AI returned an empty reply");

    return Response.json({ success: true, reply });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message || "AI generation failed",
      },
      { status: 500 },
    );
  }
}
