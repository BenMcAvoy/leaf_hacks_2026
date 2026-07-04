import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await synthesizeSpeech(text.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to synthesize speech:", err);
    return NextResponse.json(
      { error: "We couldn't generate audio. Please try again." },
      { status: 500 },
    );
  }
}
