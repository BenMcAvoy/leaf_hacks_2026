"use server";

import { CognitiveLoadManager } from "@/lib/services/cognitive-load-manager";
import { SensoryAndCognitiveProfile } from "@/lib/types";

export async function parseTextAction(text: string, readingLevel: SensoryAndCognitiveProfile["readingLevel"]) {
  return await CognitiveLoadManager.parseContent(text, readingLevel);
}
