"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type BrainiacMood = "greeting" | "thinking" | "happy" | "error";

interface BrainiacState {
  visible: boolean;
  mood: BrainiacMood;
  message?: string;
}

interface BrainiacContextValue extends BrainiacState {
  show: (mood: BrainiacMood, message?: string, durationMs?: number) => void;
  hide: () => void;
}

const DEFAULT_DURATION = 4000;

const BrainiacContext = createContext<BrainiacContextValue | null>(null);

export function BrainiacProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BrainiacState>({ visible: false, mood: "greeting" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const show = useCallback((mood: BrainiacMood, message?: string, durationMs?: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({ visible: true, mood, message });
    if (mood !== "thinking") {
      timeoutRef.current = setTimeout(hide, durationMs ?? DEFAULT_DURATION);
    }
  }, [hide]);

  return (
    <BrainiacContext.Provider value={{ ...state, show, hide }}>
      {children}
    </BrainiacContext.Provider>
  );
}

export function useBrainiac(): BrainiacContextValue {
  const ctx = useContext(BrainiacContext);
  if (!ctx) throw new Error("useBrainiac must be used within BrainiacProvider");
  return ctx;
}
