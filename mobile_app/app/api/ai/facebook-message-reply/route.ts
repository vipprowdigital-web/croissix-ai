import { NextRequest, NextResponse } from "next/server";
import { generateMessageReply } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const { messageText } = await req.json();

    if (!messageText || typeof messageText !== "string") {
      return NextResponse.json(
        { error: "messageText is required" },
        { status: 400 },
      );
    }

    const reply = await generateMessageReply(messageText);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("facebook-message-reply error:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 },
    );
  }
}
