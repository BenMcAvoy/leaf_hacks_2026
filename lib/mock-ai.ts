import type { LearningStyle, StudyPack } from "./types";

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function generateStudyPack(
  topic: string,
  sourceType: StudyPack["sourceType"],
  style: LearningStyle | null,
): Omit<StudyPack, "id" | "ownerId" | "createdAt"> {
  const seed = hash(topic || "study topic");
  const plainLanguage = style === "simpleSpeak";

  const overview = plainLanguage
    ? `${topic} is a topic made up of a few simple ideas. Once you break it into small pieces, it gets a lot easier to understand.`
    : `${topic} covers a core set of interconnected concepts. Understanding how each piece relates to the whole is the fastest path to mastery.`;

  const analogies = [
    `Think of ${topic} like learning to ride a bike: wobbly at first, automatic once the fundamentals click.`,
    `${topic} is similar to assembling furniture: the instructions matter less once you understand the underlying structure.`,
    `Approaching ${topic} is like cooking a new recipe: follow the steps once, then improvise once you know why each step matters.`,
  ];

  const keyPoints = [
    `${topic} builds on a small set of core definitions worth memorizing first.`,
    `Most mistakes with ${topic} come from skipping the fundamentals.`,
    `Practicing ${topic} in short repeated sessions beats one long session.`,
  ];

  const flashcards = Array.from({ length: 6 }, (_, i) => ({
    front: `${topic}: key idea #${i + 1}`,
    back: plainLanguage
      ? `Simple answer: this is one of the main things to remember about ${topic}.`
      : `This flashcard covers a foundational concept within ${topic}, forming the basis for more advanced material.`,
  }));

  const quiz = Array.from({ length: 5 }, (_, i) => {
    const correctIndex = (seed + i) % 4;
    const choices = Array.from({ length: 4 }, (_, j) =>
      j === correctIndex ? `Correct answer for question ${i + 1}` : `Distractor option ${j + 1}`,
    );
    return {
      question: `Which statement best reflects an important idea in ${topic} (question ${i + 1})?`,
      choices,
      correctIndex,
    };
  });

  const plan = [
    `Day 1: Read the overview and analogies for ${topic}.`,
    `Day 2: Review flashcards, aim for at least 80% recall.`,
    `Day 3: Take the quiz, note any missed concepts.`,
    `Day 4: Re-review missed concepts, retake the quiz.`,
    `Day 5: Teach ${topic} to someone else in your own words.`,
  ];

  return {
    topic,
    sourceType,
    overview,
    analogies: pick([analogies, analogies.slice().reverse()], seed),
    keyPoints,
    flashcards,
    quiz,
    plan,
  };
}

const ENCOURAGEMENTS = [
  "Nice work, that's exactly right!",
  "You got it! Keep that momentum going.",
  "Correct! Your recall is getting sharper.",
  "That's it! One step closer to mastering this.",
];

const CORRECTIONS = [
  "Not quite, but that's a useful mistake to learn from.",
  "Close! Let's revisit that concept before moving on.",
  "Not this time. Check the key points tab for a refresher.",
  "That's the wrong pick, but you're building understanding either way.",
];

export function quizFeedback(correct: boolean, seed: number): string {
  return correct ? pick(ENCOURAGEMENTS, seed) : pick(CORRECTIONS, seed);
}

export function chatReply(message: string, topic?: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "Ask me anything about your study material and I'll help break it down.";
  if (topic) {
    return `Here's a quick take on "${trimmed}" as it relates to ${topic}: focus on the core definitions first, then work through an example by hand before moving to practice questions.`;
  }
  return `Here's a quick take on "${trimmed}": try breaking it into smaller pieces, and I can generate a study pack if you want a structured plan.`;
}
