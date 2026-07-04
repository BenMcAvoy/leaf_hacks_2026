"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  RiFocus3Line,
  RiImageLine,
  RiBookOpenLine,
  RiChatSmileLine,
  RiCheckLine,
  RiQuestionAnswerLine,
  RiTrophyLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/providers/auth-provider";
import { MotionItem, MotionPage, MotionPress, MotionStagger } from "@/components/motion-primitives";
import { LEARNING_STYLE_META, defaultAccessibilitySettings, type AccessibilitySettings, type LearningStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE_ICONS: Record<LearningStyle, React.ComponentType<{ className?: string }>> = {
  focusFlow: RiFocus3Line,
  picturePath: RiImageLine,
  clearRead: RiBookOpenLine,
  examEdge: RiTrophyLine,
  simpleSpeak: RiChatSmileLine,
  hintFirst: RiQuestionAnswerLine,
};

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
    <MotionPage className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-8 p-6">
      <MotionItem className="text-center">
        <h1 className="text-2xl font-semibold">Learn Your Way</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "style"
            ? "Pick the study style that fits you best. You can change this later in your profile."
            : "Fine-tune accessibility. Every option below can be changed anytime."}
        </p>
      </MotionItem>

      <AnimatePresence mode="wait">
        {step === "style" ? (
          <MotionStagger
            key="style"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {(Object.keys(LEARNING_STYLE_META) as LearningStyle[]).map((key) => {
              const meta = LEARNING_STYLE_META[key];
              const Icon = STYLE_ICONS[key];
              const selected = style === key;
              return (
                <MotionPress key={key}>
                  <Card
                    onClick={() => setStyle(key)}
                    className={cn(
                      "cursor-pointer gap-2 border-2 p-5 transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-transparent hover:border-border",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <AnimatePresence>
                        {selected && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                          >
                            <RiCheckLine className="size-5 text-primary" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <h3 className="font-medium">{meta.label}</h3>
                    <p className="text-sm text-muted-foreground">{meta.tagline}</p>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </Card>
                </MotionPress>
              );
            })}
          </MotionStagger>
        ) : (
          <MotionStagger
            key="access"
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            <MotionItem>
              <Card className="flex flex-col gap-5 p-6">
                <ToggleRow
                  label="Reduce motion"
                  description="Turns off animations and transitions."
                  checked={a11y.reduceMotion}
                  onChange={(v) => setA11y((s) => ({ ...s, reduceMotion: v }))}
                />
                <ToggleRow
                  label="Dyslexia-friendly font"
                  description="Switches to a font with wider letter and word spacing."
                  checked={a11y.dyslexiaFont}
                  onChange={(v) => setA11y((s) => ({ ...s, dyslexiaFont: v }))}
                />
                <ToggleRow
                  label="Low-stimulation colors"
                  description="Softens accent colors and contrast."
                  checked={a11y.lowStimulation}
                  onChange={(v) => setA11y((s) => ({ ...s, lowStimulation: v }))}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Text size</Label>
                    <p className="text-xs text-muted-foreground">Applies everywhere in the app.</p>
                  </div>
                  <div className="flex gap-1">
                    {(["normal", "large", "xlarge"] as const).map((size) => (
                      <Button
                        key={size}
                        type="button"
                        size="sm"
                        variant={a11y.textSize === size ? "default" : "outline"}
                        onClick={() => setA11y((s) => ({ ...s, textSize: size }))}
                      >
                        {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Line spacing</Label>
                    <p className="text-xs text-muted-foreground">More breathing room between lines.</p>
                  </div>
                  <div className="flex gap-1">
                    {(["normal", "relaxed"] as const).map((spacing) => (
                      <Button
                        key={spacing}
                        type="button"
                        size="sm"
                        variant={a11y.lineSpacing === spacing ? "default" : "outline"}
                        onClick={() => setA11y((s) => ({ ...s, lineSpacing: spacing }))}
                      >
                        {spacing === "normal" ? "Normal" : "Relaxed"}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </MotionItem>
          </MotionStagger>
        )}
      </AnimatePresence>

      <MotionItem className="flex justify-between">
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
      </MotionItem>
    </MotionPage>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
