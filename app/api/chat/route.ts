import { NextResponse } from "next/server";
import { chatReply, resolveChatNavRoute } from "@/lib/ai";
import { getDocument, getCollection, where, orderBy, limit } from "@/lib/firestore";
import type { UserProfile, StudyPack } from "@/lib/types";

export const runtime = "nodejs";

interface ChatRequestBody {
  userId: string;
  message?: string;
  audio?: { dataUrl: string; contentType: string };
  activePackId?: string;
  history: { role: "user" | "assistant"; text: string }[];
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ChatRequestBody>;

  const hasMessage = Boolean(body.message?.trim());
  const hasAudio = Boolean(body.audio?.dataUrl);
  if (!hasMessage && !hasAudio) {
    return NextResponse.json({ error: "message or audio is required" }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const profile = await getDocument<UserProfile>("users", body.userId);

    const recentPacks = await getCollection<StudyPack>(
      "studyPacks",
      where("ownerId", "==", body.userId),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    let activePack: StudyPack | null = null;
    if (body.activePackId) {
      const found = await getDocument<StudyPack>("studyPacks", body.activePackId);
      if (found && found.ownerId === body.userId) activePack = found;
    }

    const packs =
      activePack && !recentPacks.some((pack) => pack.id === activePack!.id)
        ? [activePack, ...recentPacks]
        : recentPacks;

    const { reply, navigateTo, packId, transcript } = await chatReply({
      message: body.message ?? "",
      learningStyle: profile?.learningStyle ?? null,
      packs,
      activePackId: activePack?.id ?? null,
      history: body.history ?? [],
      audio: body.audio ? { url: body.audio.dataUrl, contentType: body.audio.contentType } : undefined,
    });
    const path = resolveChatNavRoute(
      navigateTo,
      activePack?.id ?? null,
      packId ?? null,
      packs.map((pack) => pack.id).filter((id): id is string => Boolean(id)),
    );
    return NextResponse.json({ reply, navigateTo: path, transcript });
  } catch (err) {
    console.error("Failed to get chat reply:", err);
    return NextResponse.json(
      { error: "The study assistant couldn't respond. Please try again." },
      { status: 500 },
    );
  }
}
