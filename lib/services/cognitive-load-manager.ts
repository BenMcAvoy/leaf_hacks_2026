import { ai, flashModel } from "@/lib/genkit";
import { SensoryAndCognitiveProfile } from "@/lib/types";

export class CognitiveLoadManager {
  /**
   * Dynamically re-parses text based on the user's reading level.
   * Intercepts complex responses before they hit the UI.
   */
  static async parseContent(
    text: string,
    readingLevel: SensoryAndCognitiveProfile["readingLevel"],
  ): Promise<string> {
    if (readingLevel === "full_academic" || !text) {
      return text;
    }

    const systemPrompt = this.getSystemPromptForReadingLevel(readingLevel);

    try {
      const { text: simplifiedText } = await ai.generate({
        model: flashModel,
        system: systemPrompt,
        prompt: `Please reformat the following text according to the system instructions:\n\n${text}`,
      });

      return simplifiedText || text;
    } catch (error) {
      console.error("CognitiveLoadManager failed to parse content:", error);
      return text; // Fallback to original text on failure
    }
  }

  private static getSystemPromptForReadingLevel(
    level: SensoryAndCognitiveProfile["readingLevel"],
  ): string {
    switch (level) {
      case "plain_language":
        return "You are an accessibility assistant. Rewrite the provided text in plain, simple language. Avoid complex jargon, keep sentences short, and ensure it is friendly for users with cognitive fatigue or dyslexia. Do not lose the core meaning.";
      case "bulleted_synthesis":
        return "You are an accessibility assistant. Synthesize the provided text into a highly scannable, bulleted list. Highlight the most important information first. This is for users who need hyper-focused, structurally clear content (e.g., ADHD). Use bolding for key terms.";
      case "full_academic":
      default:
        return "You are a helpful assistant.";
    }
  }
}
