import { NextResponse } from "next/server";
import { chatReply } from "@/lib/ai";
import { getDocument, getCollection, where, orderBy, limit } from "@/lib/firestore";
import type { UserProfile, StudyPack } from "@/lib/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  userId: string;
  message: string;
  activePackId?: string;
  history: { role: "user" | "assistant"; text: string }[];
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ChatRequestBody>;

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const profile = await getDocument<UserProfile>("users", body.userId);

    let packs: StudyPack[] = [];
    if (body.activePackId) {
      const activePack = await getDocument<StudyPack>("studyPacks", body.activePackId);
      if (activePack && activePack.ownerId === body.userId) {
        packs = [activePack];
      }
    }
    if (packs.length === 0) {
      packs = await getCollection<StudyPack>(
        "studyPacks",
        where("ownerId", "==", body.userId),
        orderBy("createdAt", "desc"),
        limit(3),
      );
    }

    const reply = await chatReply({
      message: body.message,
      learningStyle: profile?.learningStyle ?? null,
      packs,
      history: body.history ?? [],
    });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Failed to get chat reply:", err);
    return NextResponse.json(
      { error: "The study assistant couldn't respond. Please try again." },
      { status: 500 },
    );
  }
}
