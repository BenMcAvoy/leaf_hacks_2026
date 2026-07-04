"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiLightbulbFlashLine, RiCheckboxCircleLine, RiArrowLeftRightLine } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getDocument } from "@/lib/firestore";
import { useActivePack } from "@/components/providers/active-pack-provider";
import { ReadAloudButton } from "@/components/ui/read-aloud-button";
import type { StudyPack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNeuroStore } from "@/lib/store/neuro-store";
import { globalMicroPacingEngine } from "@/lib/services/micro-pacing-engine";
import { toast } from "sonner";

export default function StudyPackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { setActivePackId } = useActivePack();

  const neuroProfile = useNeuroStore((state) => state.profile);

  useEffect(() => {
    getDocument<StudyPack>("studyPacks", id).then(setPack);
  }, [id]);

  useEffect(() => {
    setActivePackId(id);
  }, [id, setActivePackId]);

  useEffect(() => {
    // Start pacing tracker
    globalMicroPacingEngine.startTracking(() => {
      toast("You've been studying for a while! Consider taking a short micro-break.", { icon: "🧠" });
    }, neuroProfile.cognitiveLoadLimit);
    
    // Listen for rewards
    const unsub = globalMicroPacingEngine.onReward((type, sound, animate) => {
      if (type === "micro_quest_complete") {
        toast.success("Deck completed! Great focus.", {
          description: animate ? "🌟 +10 XP" : "Well done.",
        });
      }
    });

    return () => {
      globalMicroPacingEngine.stopTracking();
      unsub();
    };
  }, [neuroProfile.cognitiveLoadLimit]);

  if (!pack) {
    return <div className="p-6 text-sm text-muted-foreground">Loading study pack...</div>;
  }

  const card = pack.flashcards[cardIndex];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">{pack.topic}</h1>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <Card className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">Simplified explanation</h2>
              <ReadAloudButton text={pack.overview} className="-mt-1 -mr-1" />
            </div>
            <p className="text-sm leading-relaxed">{pack.overview}</p>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <RiLightbulbFlashLine className="size-4" /> Key analogies
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {pack.analogies.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <RiCheckboxCircleLine className="size-4" /> Key points
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {pack.keyPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground">
            Card {cardIndex + 1} of {pack.flashcards.length}
          </p>
          <Card
            onClick={() => setFlipped((f) => !f)}
            className="flex h-56 w-full max-w-sm cursor-pointer items-center justify-center p-6 text-center relative group"
          >
            <p className="text-base font-medium">{flipped ? card.content.back : card.content.front}</p>
            <div 
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <ReadAloudButton text={flipped ? card.content.back : card.content.front} />
            </div>
          </Card>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={cardIndex === 0}
              onClick={() => {
                setFlipped(false);
                setCardIndex((i) => Math.max(0, i - 1));
              }}
            >
              Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFlipped((f) => !f)}>
              <RiArrowLeftRightLine className="size-4" /> Flip
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={cardIndex === pack.flashcards.length - 1}
              onClick={() => {
                setFlipped(false);
                if (cardIndex === pack.flashcards.length - 1) {
                   globalMicroPacingEngine.triggerReward("micro_quest_complete", neuroProfile.visualStimulation);
                } else {
                   setCardIndex((i) => Math.min(pack.flashcards.length - 1, i + 1));
                }
              }}
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {pack.quiz.length} questions, ready when you are.
          </p>
          <Button onClick={() => router.push(`/pack/${id}/quiz`)}>Start quiz</Button>
        </TabsContent>

        <TabsContent value="plan">
          <Card className="p-4">
            <ol className="space-y-3 text-sm">
              {pack.plan.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary",
                    )}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
