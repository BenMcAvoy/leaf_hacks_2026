"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    const a11y = profile?.accessibility;

    root.classList.toggle("reduce-motion", !!a11y?.reduceMotion);
    root.classList.toggle("dyslexia-font", !!a11y?.dyslexiaFont);
    root.classList.toggle("low-stimulation", !!a11y?.lowStimulation);
    root.setAttribute("data-text-size", a11y?.textSize ?? "normal");
    root.setAttribute("data-line-spacing", a11y?.lineSpacing ?? "normal");
    root.setAttribute("data-learning-style", profile?.learningStyle ?? "none");
  }, [profile]);

  return <>{children}</>;
}
