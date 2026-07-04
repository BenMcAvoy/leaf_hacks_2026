import { z } from "genkit";
import { ai, flashModel, ttsModel } from "./genkit";
import { pcmBase64ToWavBase64 } from "./audio";
import { LEARNING_STYLE_META, type LearningStyle, type StudyPack, type SensoryAndCognitiveProfile, type InterestProfile } from "./types";
import { FlashcardAdapter } from "./adapters/flashcard-adapter";

export const CHAT_NAV_TARGETS = ["dashboard", "upload", "packs", "squads", "profile", "active_pack", "pack"] as const;
export type ChatNavTarget = (typeof CHAT_NAV_TARGETS)[number];

const CHAT_NAV_ROUTES: Record<Exclude<ChatNavTarget, "active_pack" | "pack">, string> = {
  dashboard: "/dashboard",
  upload: "/upload",
  packs: "/packs",
  squads: "/squads",
  profile: "/profile",
};

export function resolveChatNavRoute(
  target: ChatNavTarget | null,
  activePackId: string | null,
  packId: string | null,
  validPackIds: string[],
): string | null {
  if (!target) return null;
  if (target === "active_pack") return activePackId ? `/pack/${activePackId}` : "/packs";
  if (target === "pack") return packId && validPackIds.includes(packId) ? `/pack/${packId}` : "/packs";
  return CHAT_NAV_ROUTES[target];
}

const studyPackSchema = z.object({
  overview: z.string(),
  analogies: z.array(z.string()),
  keyPoints: z.array(z.string()),
  flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
  quiz: z.array(
    z.object({
      question: z.string(),
      choices: z.array(z.string()),
      correctIndex: z.number().int(),
    }),
  ),
  plan: z.array(z.string()),
});

const RETRYABLE_STATUS = new Set([429, 500, 503, 504]);

function isRetryableError(err: unknown): boolean {
  const status = (err as { status?: number; statusCode?: number } | null)?.status
    ?? (err as { statusCode?: number } | null)?.statusCode;
  if (status !== undefined) return RETRYABLE_STATUS.has(status);
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes("overloaded") ||
    message.includes("unavailable") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("503")
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxDurationMs = 10000): Promise<T> {
  const start = Date.now();
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableError(err)) throw err;
      const elapsed = Date.now() - start;
      if (elapsed >= maxDurationMs) throw err;
      const delayMs = Math.min(500 * 2 ** (attempt - 1), maxDurationMs - elapsed);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function styleInstruction(style: LearningStyle | null): string {
  if (!style) return "";
  const meta = LEARNING_STYLE_META[style];
  return `Tailor the writing style to "${meta.label}": ${meta.description}`;
}

function getAnalogyEnginePrompt(profile: InterestProfile | undefined): string {
  if (!profile || !profile.analogyEngineEnabled || !profile.primaryInterestCategory) return "";

  const tags = profile.specificInterestKeywords.length > 0 
    ? `Specifically focusing on: ${profile.specificInterestKeywords.join(", ")}.` 
    : "";

  if (profile.intensityScale === "immersive") {
    return `[HYPER-FIXATION OVERRIDE ACTIVE]
You MUST rewrite all explanations entirely through the lens of "${profile.primaryInterestCategory}". ${tags}
Do not just provide a single analogy; construct the entire pedagogical framework around this interest. Map core mechanisms (e.g. cellular respiration, calculus derivatives) directly to mechanics within the user's interest (e.g. Minecraft redstone logic, crafting recipes) ensuring factual accuracy is preserved.`;
  }

  return `[ANALOGY ENGINE ACTIVE]
When explaining complex topics, please include at least one clear, brief analogy related to "${profile.primaryInterestCategory}". ${tags}`;
}

export async function generateStudyPack(input: {
  topic: string;
  sourceType: StudyPack["sourceType"];
  learningStyle: LearningStyle | null;
  readingLevel?: SensoryAndCognitiveProfile["readingLevel"];
  interestProfile?: InterestProfile;
  textContent?: string;
  media?: { url: string; contentType: string };
}): Promise<Omit<StudyPack, "id" | "ownerId" | "createdAt">> {
  
  let simplificationPrompt = "";
  if (input.readingLevel === "plain_language") {
    simplificationPrompt = "Rewrite the output in plain, simple language. Avoid complex jargon, keep sentences short, and ensure it is friendly for users with cognitive fatigue or dyslexia. Do not lose the core meaning.";
  } else if (input.readingLevel === "bulleted_synthesis") {
    simplificationPrompt = "Synthesize the output into a highly scannable, bulleted list where possible. Highlight the most important information first for users who need hyper-focused, structurally clear content (e.g., ADHD). Use bolding for key terms.";
  }

  const promptParts: ({ text: string } | { media: { url: string; contentType: string } })[] = [
    {
      text: [
        `You are generating a study pack for the topic "${input.topic}".`,
        styleInstruction(input.learningStyle),
        getAnalogyEnginePrompt(input.interestProfile),
        simplificationPrompt,
        input.textContent
          ? `Base the content on this source material:\n\n${input.textContent}`
          : "Base the content on the attached material.",
        "Produce: a short overview, 3 analogies, 3 key points, 6 flashcards, a 5-question multiple choice quiz (4 choices each, correctIndex 0-based), and a 5-day study plan.",
        "Vary the position of the correct answer across quiz questions, don't always place it at the same index.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
  if (input.media) promptParts.push({ media: input.media });

  const { output } = await withRetry(() =>
    ai.generate({
      model: flashModel,
      prompt: promptParts,
      output: { schema: studyPackSchema },
    }),
  );

  if (!output) throw new Error("Gemini returned no output for study pack generation");

  return {
    topic: input.topic,
    sourceType: input.sourceType,
    ...output,
    flashcards: FlashcardAdapter.migrateLegacyFlashcards(output.flashcards),
    legacyFlashcards: output.flashcards,
  };
}

function formatPackDate(createdAt: unknown): string {
  const value = createdAt as { toDate?: () => Date } | Date | string | null | undefined;
  const date =
    value && typeof (value as { toDate?: () => Date }).toDate === "function"
      ? (value as { toDate: () => Date }).toDate()
      : value instanceof Date
        ? value
        : typeof value === "string"
          ? new Date(value)
          : null;
  if (!date || Number.isNaN(date.getTime())) return "unknown date";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function summarizePack(pack: StudyPack): string {
  return [
    `Topic: ${pack.topic} (created ${formatPackDate(pack.createdAt)})`,
    `Overview: ${pack.overview}`,
    pack.keyPoints.length ? `Key points: ${pack.keyPoints.slice(0, 3).join("; ")}` : "",
    pack.flashcards.length
      ? `Sample flashcards: ${pack.flashcards
          .slice(0, 2)
          .map((f) => `${f.content.front} -> ${f.content.back}`)
          .join(" | ")}`
      : "",
    pack.quiz.length ? `Quiz covers: ${pack.quiz.slice(0, 3).map((q) => q.question).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const chatReplySchema = z.object({
  reply: z.string(),
  navigateTo: z.enum(CHAT_NAV_TARGETS).nullable(),
  packId: z.string().nullable().optional(),
  transcript: z.string().optional(),
});

export async function chatReply(input: {
  message: string;
  learningStyle: LearningStyle | null;
  readingLevel?: SensoryAndCognitiveProfile["readingLevel"];
  interestProfile?: InterestProfile;
  packs: StudyPack[];
  activePackId?: string | null;
  history: { role: "user" | "assistant"; text: string }[];
  audio?: { url: string; contentType: string };
}): Promise<{ reply: string; navigateTo: ChatNavTarget | null; packId?: string | null; transcript?: string }> {
  let simplificationPrompt = "";
  if (input.readingLevel === "plain_language") {
    simplificationPrompt = "Rewrite your responses in plain, simple language. Avoid complex jargon, keep sentences short, and ensure it is friendly for users with cognitive fatigue or dyslexia. Do not lose the core meaning.";
  } else if (input.readingLevel === "bulleted_synthesis") {
    simplificationPrompt = "Synthesize your responses into highly scannable, bulleted lists where possible. Highlight the most important information first. Use bolding for key terms.";
  }

  const packList = input.packs
    .map(
      (pack) =>
        `- "${pack.topic}" [id: ${pack.id}]${pack.id === input.activePackId ? " (currently open)" : ""}, created ${formatPackDate(pack.createdAt)}`,
    )
    .join("\n");
  const detailedPacks = input.packs.slice(0, 5).map(summarizePack).join("\n\n");

  const systemText = [
    "You are a concise, encouraging study assistant embedded in a learning app.",
    "Answer in 2-3 short sentences unless more detail is clearly requested.",
    "The app calls the user's study material 'study packs', but users may casually call them 'decks' or 'cards'; treat those terms as synonyms for study packs and never claim you lack access to them.",
    styleInstruction(input.learningStyle),
    getAnalogyEnginePrompt(input.interestProfile),
    simplificationPrompt,
    input.packs.length
      ? [
          `The user has ${input.packs.length} study pack(s), most recent first (the first one listed is the latest/newest):`,
          packList,
          "",
          "Details for the most recent packs:",
          detailedPacks,
        ].join("\n")
      : "The user has no study packs yet; answer generally and encourage them to create one.",
    "You can optionally direct the app to navigate the user to a screen by setting navigateTo. Only set it when the user is clearly asking to go/take them somewhere (e.g. 'take me to my flashcards', 'open my profile', 'show me my squad'); otherwise leave it null.",
    "Valid navigateTo values: dashboard = home/dashboard screen; upload = the add/upload a new study pack screen; packs = the full list of the user's study packs (flashcards/decks); squads = the squads/social screen; profile = the user's profile screen; active_pack = the study pack currently open (only use if the user references 'this pack' / 'the current one' and one is open); pack = a specific study pack from the list above, identified by name or as 'my latest/newest deck/pack'.",
    "When navigateTo is 'pack', also set packId to the exact id shown in brackets next to that pack in the list above. Never invent an id that isn't in the list. If the user asks for 'my latest' or 'newest' pack, use the id of the first pack listed. If they name a pack that doesn't closely match anything in the list, leave navigateTo null and mention in the reply that you couldn't find it.",
    input.audio
      ? [
          "The user's message was spoken and is attached as audio. Listen carefully and transcribe it into the transcript field as accurately as possible, word for word.",
          "Use the study pack topics, key points, and flashcard terms listed above as context to correctly resolve any unclear, technical, or domain-specific words the user says; prefer a transcription consistent with their study material over a generic-sounding guess.",
          "Ignore filler sounds like 'um' or 'uh', but keep everything else verbatim, do not paraphrase or summarize.",
          "Then treat that transcript as their message for your reply and navigation decision.",
        ].join(" ")
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const firstUserTurnIndex = input.history.findIndex((turn) => turn.role === "user");
  const historyFromFirstUserTurn =
    firstUserTurnIndex === -1 ? [] : input.history.slice(firstUserTurnIndex);

  const lastContent: ({ text: string } | { media: { url: string; contentType: string } })[] = [
    { text: input.message || "(spoken message, transcribe the attached audio)" },
  ];
  if (input.audio) lastContent.push({ media: input.audio });

  const messages = [
    ...historyFromFirstUserTurn.map((turn) => ({
      role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
      content: [{ text: turn.text }],
    })),
    { role: "user" as const, content: lastContent },
  ];

  const { output } = await withRetry(() =>
    ai.generate({
      model: flashModel,
      system: systemText,
      messages,
      output: { schema: chatReplySchema },
    }),
  );

  if (!output) throw new Error("Gemini returned no output for chat reply");

  if (output.transcript !== undefined && output.transcript.trim() === "") {
    return { reply: "I didn't catch that, could you try again?", navigateTo: null, transcript: "" };
  }

  return {
    reply: output.reply,
    navigateTo: output.navigateTo,
    packId: output.packId ?? null,
    transcript: output.transcript,
  };
}

const definitionGradeSchema = z.object({
  correct: z.boolean(),
  feedback: z.string(),
  transcript: z.string().optional(),
});

export async function gradeDefinitionAnswer(input: {
  term: string;
  definition: string;
  answerText?: string;
  answerAudio?: { url: string; contentType: string };
}): Promise<{ correct: boolean; feedback: string; transcript?: string }> {
  const hasAudio = Boolean(input.answerAudio);
  const instructionParts: string[] = [
    `You are grading a flashcard recall quiz.`,
    `The definition shown to the user was: "${input.definition}"`,
    `The correct term is: "${input.term}"`,
    hasAudio
      ? `The user's spoken answer is attached as audio. First transcribe exactly what they said into the transcript field, then grade it.`
      : `The user typed this answer: "${input.answerText}"`,
    `Mark correct if the answer is the correct term, a close synonym, an accepted alternate name, or has only minor typos or case differences. Mark incorrect if it names a different concept, is blank, or is clearly wrong. Ignore filler words like "um" or "uh" when grading a spoken answer.`,
    `Return one short feedback sentence (max 20 words). Encourage the user if correct. If incorrect, gently state the correct term.`,
  ];

  const promptParts: ({ text: string } | { media: { url: string; contentType: string } })[] = [
    { text: instructionParts.join("\n\n") },
  ];
  if (input.answerAudio) {
    promptParts.push({ media: { url: input.answerAudio.url, contentType: input.answerAudio.contentType } });
  }

  const { output } = await withRetry(() =>
    ai.generate({
      model: flashModel,
      prompt: promptParts,
      output: { schema: definitionGradeSchema },
    }),
  );

  if (!output) throw new Error("Gemini returned no output for definition grading");
  return output;
}

export async function synthesizeSpeech(text: string): Promise<{ audioBase64: string; mimeType: string }> {
  const result = await withRetry(() =>
    ai.generate({
      model: ttsModel,
      prompt: text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    }),
  );

  const mediaUrl = result.media?.url;
  if (!mediaUrl) throw new Error("Gemini returned no audio for speech synthesis");

  // mediaUrl is a data URL like "data:audio/L16;rate=24000;...;base64,<pcm>"
  const base64Pcm = mediaUrl.split(",")[1];
  const wavBase64 = pcmBase64ToWavBase64(base64Pcm, {
    sampleRate: 24000,
    numChannels: 1,
    bitsPerSample: 16,
  });

  return { audioBase64: wavBase64, mimeType: "audio/wav" };
}

export function stripHtml(html: string): string {
  const withoutTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return withoutTags.slice(0, 20000);
}
