"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useNeuroStore } from "@/lib/store/neuro-store";

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const neuroProfile = useNeuroStore((state) => state.profile);

  useEffect(() => {
    const root = document.documentElement;
    const a11y = profile?.accessibility;

    // Legacy fallbacks for things not yet in neuroStore
    root.setAttribute("data-text-size", a11y?.textSize ?? "normal");
    root.setAttribute("data-line-spacing", a11y?.lineSpacing ?? "normal");

    // Neuro-Adaptive state mapping
    root.classList.toggle("reduce-motion", neuroProfile.visualStimulation === "low");
    root.classList.toggle("low-stimulation", neuroProfile.visualStimulation === "low");
    root.classList.toggle("dyslexia-font", neuroProfile.readingLevel === "plain_language");
    
    root.setAttribute("data-reading-level", neuroProfile.readingLevel);
    root.setAttribute("data-ui-complexity", neuroProfile.uiComplexityLevel);
  }, [profile, neuroProfile]);

  return <>{children}</>;
}
