export type LearningStyle = "focusFlow" | "picturePath" | "clearRead" | "simpleSpeak";

export interface SensoryAndCognitiveProfile {
  uiComplexityLevel: "minimal" | "standard" | "rich";
  cognitiveLoadLimit: number;
  visualStimulation: "low" | "standard" | "high";
  readingLevel: "plain_language" | "bulleted_synthesis" | "full_academic";
}

export const defaultSensoryAndCognitiveProfile: SensoryAndCognitiveProfile = {
  uiComplexityLevel: "standard",
  cognitiveLoadLimit: 20,
  visualStimulation: "standard",
  readingLevel: "full_academic",
};

export interface InterestProfile {
  analogyEngineEnabled: boolean;
  primaryInterestCategory: string;
  specificInterestKeywords: string[];
  intensityScale: "subtle" | "immersive";
}

export const defaultInterestProfile: InterestProfile = {
  analogyEngineEnabled: false,
  primaryInterestCategory: "",
  specificInterestKeywords: [],
  intensityScale: "subtle",
};

/** @deprecated */
export interface AccessibilitySettings {
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  textSize: "normal" | "large" | "xlarge";
  lineSpacing: "normal" | "relaxed";
  lowStimulation: boolean;
  enableTTS: boolean;
  ttsVoiceUri: string;
}

/** @deprecated */
export const defaultAccessibilitySettings: AccessibilitySettings = {
  reduceMotion: false,
  dyslexiaFont: false,
  textSize: "normal",
  lineSpacing: "normal",
  lowStimulation: false,
  enableTTS: false,
  ttsVoiceUri: "",
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
  learningStyle: LearningStyle | null;
  /** @deprecated */
  accessibility: AccessibilitySettings;
  sensoryProfile?: SensoryAndCognitiveProfile;
  interestProfile?: InterestProfile;
  voiceModeEnabled: boolean;
  xp: number;
  level: number;
  streakCount: number;
  streakFreezeAvailable: boolean;
  lastActiveDate: string | null;
  squadId: string | null;
  badges: string[];
  basicInfo: {
    headline: string;
    bio: string;
    location: string;
  };
  experience: { title: string; org: string; period: string }[];
  qualifications: { name: string; issuer: string; year: string }[];
  languages: { name: string; level: string }[];
  skills: string[];
}

/** @deprecated */
export interface Flashcard {
  front: string;
  back: string;
}

export interface MultiSensoryFlashcard {
  id: string;
  content: {
    front: string;
    back: string;
  };
  audio?: {
    frontUri?: string;
    backUri?: string;
  };
  visualMnemonic?: string;
  metadata: {
    complexityScore?: number;
    structuralTags?: string[];
  };
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
}

export interface StudyPack {
  id?: string;
  ownerId: string;
  topic: string;
  sourceType: "photo" | "file" | "notes" | "link";
  overview: string;
  analogies: string[];
  keyPoints: string[];
  flashcards: MultiSensoryFlashcard[];
  legacyFlashcards?: Flashcard[];
  quiz: QuizQuestion[];
  plan: string[];
  createdAt?: unknown;
}

export interface Squad {
  id?: string;
  name: string;
  memberIds: string[];
  totalXp: number;
  weeklyChallenge: string;
}

export const LEARNING_STYLE_META: Record<
  LearningStyle,
  { label: string; tagline: string; description: string }
> = {
  focusFlow: {
    label: "Focus Flow",
    tagline: "Short bursts, clear momentum",
    description: "Content is broken into short micro-sessions with visible progress, minimal motion.",
  },
  picturePath: {
    label: "Picture Path",
    tagline: "Learn through pictures and analogies",
    description: "Every concept gets a visual card and a real-world analogy alongside the text.",
  },
  clearRead: {
    label: "Clear Read",
    tagline: "Clean layouts, high contrast",
    description: "Larger line-height, high-contrast text, and precise, low-fluff writing.",
  },
  simpleSpeak: {
    label: "Simple Speak",
    tagline: "Plain English, no jargon",
    description: "Short words, short sentences, and inline definitions for any technical term.",
  },
};

export const XP_PER_LEVEL = 500;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export const BADGE_UNLOCKS: { level: number; badge: string; perk: string }[] = [
  { level: 2, badge: "First Steps", perk: "Custom avatar color" },
  { level: 3, badge: "Consistent", perk: "Extra streak freeze token" },
  { level: 5, badge: "Squad Leader", perk: "Squad customization unlocked" },
  { level: 8, badge: "Sharp Mind", perk: "Priority AI response styling" },
  { level: 12, badge: "Scholar", perk: "Exclusive profile frame" },
];
