"use client";

import { useBrainiac } from "@/components/providers/brainiac-provider";
import { cn } from "@/lib/utils";

const MOOD_STYLES = {
  greeting: "brainiac-bob",
  thinking: "brainiac-wobble",
  happy: "brainiac-bounce",
  error: "brainiac-shake",
} as const;

const MOOD_LABEL = {
  greeting: "Brainiac waving hello",
  thinking: "Brainiac thinking",
  happy: "Brainiac happy",
  error: "Brainiac concerned",
} as const;

export function BrainiacMascot() {
  const { visible, mood, message } = useBrainiac();

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-20 left-4 z-50 flex items-end gap-2 sm:bottom-6"
      aria-live="polite"
    >
      {message && (
        <div className="brainiac-pop-in mb-2 max-w-[12rem] rounded-2xl rounded-bl-sm border bg-card px-3 py-2 text-xs text-card-foreground shadow-lg">
          {message}
        </div>
      )}
      <svg
        role="img"
        aria-label={MOOD_LABEL[mood]}
        viewBox="0 0 64 64"
        className={cn("brainiac-pop-in size-14 drop-shadow-lg", MOOD_STYLES[mood])}
      >
        <ellipse cx="32" cy="34" rx="26" ry="22" className="fill-primary" />
        <path
          d="M14 26c2-8 10-14 18-14s16 6 18 14"
          fill="none"
          className="stroke-primary-foreground/40"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="32"
          r="4"
          className={cn("fill-primary-foreground", mood !== "error" && "brainiac-blink")}
        />
        <circle
          cx="40"
          cy="32"
          r="4"
          className={cn("fill-primary-foreground", mood !== "error" && "brainiac-blink")}
        />
        {mood === "error" ? (
          <path
            d="M26 46c2-3 10-3 12 0"
            fill="none"
            className="stroke-primary-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M26 42c2 3 10 3 12 0"
            fill="none"
            className="stroke-primary-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        {mood === "happy" && (
          <path
            d="M50 12l1.6 4.4L56 18l-4.4 1.6L50 24l-1.6-4.4L44 18l4.4-1.6z"
            className="fill-accent-foreground brainiac-sparkle"
          />
        )}
      </svg>
    </div>
  );
}
