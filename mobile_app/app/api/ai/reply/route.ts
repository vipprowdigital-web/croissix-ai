// mobile_app\app\api\ai\reply\route.ts
import { generateReviewReply } from "@/lib/aiService";

export async function POST(req: Request) {
  try {
    const {
      review,
      rating,
      reviewerName,
      businessName,
      tone,
    } = await req.json();

    if (!review) {
      return Response.json(
        { success: false, error: "Review text required" },
        { status: 400 },
      );
    }

    const reply = await generateReviewReply(
      review,
      rating,
      reviewerName,
      businessName,
      tone,
    );

    return Response.json({
      success: true,
      reply,
    });
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
