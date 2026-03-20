// mobile_app\app\api\ai\chat\route.ts
// mobile_app/app/api/ai/chat/route.ts

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { success: false, error: "Invalid messages" },
        { status: 400 },
      );
    }

    // Filter out any empty content messages to avoid Groq errors
    const cleanMessages = messages.filter(
      (m: any) => m?.role && typeof m?.content === "string" && m.content.trim(),
    );

    const completion = await groq.chat.completions.create({
      model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
      messages: cleanMessages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            if (content) {
              const data = `data: ${JSON.stringify({
                choices: [{ delta: { content } }],
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // disable Nginx buffering for SSE
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return Response.json(
      { success: false, error: error.message || "Chat generation failed" },
      { status: 500 },
    );
  }
}
