"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiAddLine, RiLightbulbFlashLine, RiCheckboxCircleLine, RiArrowLeftRightLine } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDocument, updateDocument } from "@/lib/firestore";
import type { Flashcard, StudyPack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudyPackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDocument<StudyPack>("studyPacks", id).then(setPack);
  }, [id]);

  async function saveCard() {
    if (!pack || !newFront.trim() || !newBack.trim()) return;
    setSaving(true);
    try {
      const updated: Flashcard[] = [...pack.flashcards, { front: newFront.trim(), back: newBack.trim() }];
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
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Simplified explanation</h2>
            <p className="text-sm leading-relaxed">{pack.overview}</p>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <RiLightbulbFlashLine className="size-4" aria-hidden /> Key analogies
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {pack.analogies.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <RiCheckboxCircleLine className="size-4" aria-hidden /> Key points
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
            role="button"
            tabIndex={0}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped((f) => !f); } }}
            aria-label={`${flipped ? "Back" : "Front"}: ${flipped ? card.back : card.front}. Press to flip.`}
            className="flex h-56 w-full max-w-sm cursor-pointer items-center justify-center p-6 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <p className="text-base font-medium" aria-hidden="true">{flipped ? card.back : card.front}</p>
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
              <RiArrowLeftRightLine className="size-4" aria-hidden /> Flip
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={cardIndex === pack.flashcards.length - 1}
              onClick={() => {
                setFlipped(false);
                setCardIndex((i) => Math.min(pack.flashcards.length - 1, i + 1));
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
