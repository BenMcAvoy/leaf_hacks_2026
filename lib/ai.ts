import { z } from "genkit";
import { ai, flashModel } from "./genkit";
import { LEARNING_STYLE_META, type LearningStyle, type StudyPack } from "./types";

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

function styleInstruction(style: LearningStyle | null): string {
  if (!style) return "";
  const meta = LEARNING_STYLE_META[style];
  return `Tailor the writing style to "${meta.label}": ${meta.description}`;
}

export async function generateStudyPack(input: {
  topic: string;
  sourceType: StudyPack["sourceType"];
  learningStyle: LearningStyle | null;
  textContent?: string;
  media?: { url: string; contentType: string };
}): Promise<Omit<StudyPack, "id" | "ownerId" | "createdAt">> {
  const promptParts: ({ text: string } | { media: { url: string; contentType: string } })[] = [
    {
      text: [
        `You are generating a study pack for the topic "${input.topic}".`,
        styleInstruction(input.learningStyle),
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

  const { output } = await ai.generate({
    model: flashModel,
    prompt: promptParts,
    output: { schema: studyPackSchema },
  });

  if (!output) throw new Error("Gemini returned no output for study pack generation");

  return {
    topic: input.topic,
    sourceType: input.sourceType,
    ...output,
  };
}

export async function chatReply(input: { message: string; topic?: string }): Promise<string> {
  const { text } = await ai.generate({
    model: flashModel,
    prompt: [
      {
        text: [
          "You are a concise, encouraging study assistant embedded in a learning app.",
          input.topic ? `The user is currently studying "${input.topic}".` : "",
          `Answer this question in 2-3 short sentences: ${input.message}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });
  return text;
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
