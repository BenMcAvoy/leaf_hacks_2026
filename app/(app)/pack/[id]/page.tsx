"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RiAddLine, RiLightbulbFlashLine, RiCheckboxCircleLine, RiArrowLeftRightLine } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDocument, updateDocument } from "@/lib/firestore";
import { useActivePack } from "@/components/providers/active-pack-provider";
import { ReadAloudButton } from "@/components/ui/read-aloud-button";
import { MotionItem, MotionPage, MotionPress, MotionStagger } from "@/components/motion-primitives";
import { MOCK_STUDY_PACK } from "@/lib/mock-data";
import type { StudyPack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNeuroStore } from "@/lib/store/neuro-store";
import { globalMicroPacingEngine } from "@/lib/services/micro-pacing-engine";
import { FlashcardAdapter } from "@/lib/adapters/flashcard-adapter";
import { toast } from "sonner";

export default function StudyPackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { setActivePackId } = useActivePack();

  const neuroProfile = useNeuroStore((state) => state.profile);
  const [creating, setCreating] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPack() {
      if (id === "demo-newtons-laws") {
        const stored = window.sessionStorage.getItem("study-flow-demo-pack");
        const demo = stored ? (JSON.parse(stored) as StudyPack) : MOCK_STUDY_PACK;
        setPack({ ...demo, flashcards: FlashcardAdapter.normalizeFlashcards(demo.flashcards) });
        return;
      }
      const data = await getDocument<StudyPack>("studyPacks", id);
      const resolved = data ?? MOCK_STUDY_PACK;
      setPack({ ...resolved, flashcards: FlashcardAdapter.normalizeFlashcards(resolved.flashcards) });
    }

    void loadPack();
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

  async function saveCard() {
    if (!pack || !newFront.trim() || !newBack.trim()) return;
    setSaving(true);
    try {
      const newCard = FlashcardAdapter.migrateLegacyFlashcard({ front: newFront.trim(), back: newBack.trim() });
      const updated = [...pack.flashcards, newCard];
      await updateDocument<StudyPack>("studyPacks", id, { flashcards: updated });
      setPack({ ...pack, flashcards: updated });
      setCardIndex(updated.length - 1);
      setFlipped(false);
      setNewFront("");
      setNewBack("");
      setCreating(false);
      toast.success("Flashcard added");
    } catch {
      toast.error("Failed to save flashcard");
    } finally {
      setSaving(false);
    }
  }

  if (!pack) {
    return <div className="p-6 text-sm text-muted-foreground">Loading study pack...</div>;
  }

  const card = pack.flashcards[cardIndex];

  return (
    <MotionPage className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <MotionItem>
        <h1 className="text-xl font-semibold">{pack.topic}</h1>
      </MotionItem>

      <MotionItem>
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <MotionStagger className="flex flex-col gap-4">
          <MotionItem>
          <Card className="relative gap-4 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">Simplified explanation</h2>
                <ReadAloudButton text={pack.overview} className="-mt-1 -mr-1" />
              </div>
              <p className="text-sm leading-relaxed">{pack.overview}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3">
              <h3 className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
                <RiLightbulbFlashLine className="size-4" /> Picture Path analogy
              </h3>
              <p className="text-sm">{pack.analogies[0]}</p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <RiCheckboxCircleLine className="size-4" /> Key points
              </h3>
              <ul className="grid gap-2 text-sm">
                {pack.keyPoints.slice(0, 4).map((point) => (
                  <li key={point} className="rounded-xl bg-muted px-3 py-2">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          </MotionItem>
          </MotionStagger>
        </TabsContent>

        <TabsContent value="flashcards" className="flex flex-col items-center gap-4">
          <p className="text-xs text-muted-foreground">
            Card {cardIndex + 1} of {pack.flashcards.length}
          </p>
          <AnimatePresence mode="wait">
          <motion.div
            key={`${cardIndex}-${flipped ? "back" : "front"}`}
            initial={{ opacity: 0, rotateY: flipped ? -18 : 18, scale: 0.98 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: flipped ? 18 : -18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
          <Card
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped((f) => !f); } }}
            aria-label={`${flipped ? "Back" : "Front"}: ${flipped ? card.content.back : card.content.front}. Press to flip.`}
            className="flex h-56 w-full max-w-sm cursor-pointer items-center justify-center p-6 text-center relative group focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <p className="text-base font-medium" aria-hidden="true">{flipped ? card.content.back : card.content.front}</p>
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <ReadAloudButton text={flipped ? card.content.back : card.content.front} />
            </div>
          </Card>
          </motion.div>
          </AnimatePresence>
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
              <RiArrowLeftRightLine className="size-4" aria-hidden /> Flip
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

          {creating ? (
            <Card className="flex w-full max-w-sm flex-col gap-3 p-4">
              <h2 className="text-sm font-medium">New flashcard</h2>
              <div className="flex flex-col gap-1">
                <Label htmlFor="card-front">Front</Label>
                <Input
                  id="card-front"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Question or term"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="card-back">Back</Label>
                <Input
                  id="card-back"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Answer or definition"
                  onKeyDown={(e) => { if (e.key === "Enter") saveCard(); }}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveCard} disabled={!newFront.trim() || !newBack.trim() || saving} className="flex-1">
                  {saving ? "Saving..." : "Add card"}
                </Button>
                <Button variant="outline" onClick={() => { setCreating(false); setNewFront(""); setNewBack(""); }}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              <RiAddLine className="size-4" aria-hidden /> Create flashcard
            </Button>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="flex flex-col items-center gap-4 py-8 text-center">
          <MotionItem>
          <p className="text-sm text-muted-foreground">
            {pack.quiz.length} questions, ready when you are.
          </p>
          </MotionItem>
          <MotionPress>
          <Button onClick={() => router.push(`/pack/${id}/quiz`)}>Start quiz</Button>
          </MotionPress>
          {pack.flashcards.length > 0 && (
            <MotionPress>
            <Button variant="outline" onClick={() => router.push(`/pack/${id}/quiz/define`)}>
              Definition mode
            </Button>
            </MotionPress>
          )}
        </TabsContent>

        <TabsContent value="plan">
          <MotionItem>
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
          </MotionItem>
        </TabsContent>
      </Tabs>
      </MotionItem>
    </MotionPage>
  );
}
