import { NextResponse } from "next/server";
import { generateStudyPack, stripHtml } from "@/lib/ai";
import type { LearningStyle, StudyPack, SensoryAndCognitiveProfile, InterestProfile } from "@/lib/types";

export const runtime = "nodejs";

interface StudyPackRequest {
  topic: string;
  sourceType: StudyPack["sourceType"];
  learningStyle: LearningStyle | null;
  readingLevel?: SensoryAndCognitiveProfile["readingLevel"];
  interestProfile?: InterestProfile;
  notes?: string;
  link?: string;
  fileUrl?: string;
  fileMimeType?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as StudyPackRequest;
  const { topic, sourceType, learningStyle, readingLevel, interestProfile } = body;

  if (!topic?.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  try {
    let textContent: string | undefined;
    let media: { url: string; contentType: string } | undefined;

    if (sourceType === "notes") {
      textContent = body.notes;
    } else if (sourceType === "link" && body.link) {
      const pageRes = await fetch(body.link);
      if (!pageRes.ok) throw new Error(`Failed to fetch link: ${pageRes.status}`);
      textContent = stripHtml(await pageRes.text());
    } else if ((sourceType === "photo" || sourceType === "file") && body.fileUrl) {
      const fileRes = await fetch(body.fileUrl);
      if (!fileRes.ok) throw new Error(`Failed to fetch uploaded file: ${fileRes.status}`);
      const buffer = Buffer.from(await fileRes.arrayBuffer());
      const contentType = body.fileMimeType || fileRes.headers.get("content-type") || "application/octet-stream";
      media = { url: `data:${contentType};base64,${buffer.toString("base64")}`, contentType };
    }

    const studyPack = await generateStudyPack({
      topic: topic.trim(),
      sourceType,
      learningStyle,
      readingLevel,
      interestProfile,
      textContent,
      media,
    });

    return NextResponse.json(studyPack);
  } catch (err) {
    console.error("Failed to generate study pack:", err);
    return NextResponse.json(
      { error: "We couldn't generate your study pack. Please try again." },
      { status: 500 },
    );
  }
}
