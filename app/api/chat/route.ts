import { NextResponse } from "next/server";
import { chatReply } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { message: string; topic?: string };

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    const reply = await chatReply({ message: body.message, topic: body.topic });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Failed to get chat reply:", err);
    return NextResponse.json(
      { error: "The study assistant couldn't respond. Please try again." },
      { status: 500 },
    );
  }
}
