import { NextResponse } from "next/server";
import { gradeDefinitionAnswer } from "@/lib/ai";

export const runtime = "nodejs";

interface GradeRequest {
  term: string;
  definition: string;
  answerText?: string;
  answerAudio?: { dataUrl: string; contentType: string };
}

export async function POST(req: Request) {
  const body = (await req.json()) as GradeRequest;
  const { term, definition, answerText, answerAudio } = body;

  if (!term?.trim() || !definition?.trim()) {
    return NextResponse.json({ error: "term and definition are required" }, { status: 400 });
  }
  if (!answerText?.trim() && !answerAudio?.dataUrl) {
    return NextResponse.json({ error: "answerText or answerAudio is required" }, { status: 400 });
  }

  try {
    const result = await gradeDefinitionAnswer({
      term: term.trim(),
      definition: definition.trim(),
      answerText: answerText?.trim(),
      answerAudio: answerAudio
        ? { url: answerAudio.dataUrl, contentType: answerAudio.contentType }
        : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to grade definition answer:", err);
    return NextResponse.json(
      { error: "We couldn't grade that answer. Please try again." },
      { status: 500 },
    );
  }
}
