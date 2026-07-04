"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccessibilityControls } from "@/components/accessibility-controls";
import { LearningStyleSelector } from "@/components/learning-style-selector";
import { useAuth } from "@/components/providers/auth-provider";
import { defaultAccessibilitySettings, type AccessibilitySettings, type LearningStyle } from "@/lib/types";

export default function OnboardingPage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"style" | "access">("style");
  const [style, setStyle] = useState<LearningStyle | null>(null);
  const [a11y, setA11y] = useState<AccessibilitySettings>(defaultAccessibilitySettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
    if (!loading && profile?.onboardingComplete) router.replace("/dashboard");
  }, [loading, user, profile, router]);

  async function finish() {
    setSaving(true);
    await updateProfile({ learningStyle: style, accessibility: a11y, onboardingComplete: true });
    router.replace("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Learn Your Way</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "style"
            ? "Pick the study style that fits you best. You can change this later in your profile."
            : "Fine-tune accessibility. Every option below can be changed anytime."}
        </p>
      </div>

      {step === "style" ? (
        <LearningStyleSelector value={style} onChange={setStyle} />
      ) : (
        <Card className="p-6">
          <AccessibilityControls value={a11y} onChange={setA11y} />
        </Card>
      )}

      <div className="flex justify-between">
        {step === "access" ? (
          <Button variant="ghost" onClick={() => setStep("style")}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {step === "style" ? (
          <Button disabled={!style} onClick={() => setStep("access")}>
            Continue
          </Button>
        ) : (
          <Button disabled={saving} onClick={finish}>
            {saving ? "Saving..." : "Start studying"}
          </Button>
        )}
      </div>
    </div>
  );
}
