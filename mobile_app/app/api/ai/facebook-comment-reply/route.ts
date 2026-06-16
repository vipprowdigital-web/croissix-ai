import { NextRequest, NextResponse } from "next/server";
import { generateCommentReply } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const { commentText, commenterName } = await req.json();

    if (!commentText || typeof commentText !== "string") {
      return NextResponse.json(
        { error: "comment is required" },
        { status: 400 },
      );
    }

    const reply = await generateCommentReply(commentText);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("facebook-comment-reply error:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 },
    );
  }
}
