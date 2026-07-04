import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

export const ai = genkit({ plugins: [googleAI()] });
export const flashModel = googleAI.model("gemini-2.5-flash-lite");
export const ttsModel = googleAI.model("gemini-2.5-flash-preview-tts");
