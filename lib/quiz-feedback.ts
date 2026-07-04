function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
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
