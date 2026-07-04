"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RiCheckLine, RiCloseLine, RiTrophyLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useActivePack } from "@/components/providers/active-pack-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import { getDocument } from "@/lib/firestore";
import { quizFeedback } from "@/lib/quiz-feedback";
import { xpForQuizResult, updateStreak, applyXp } from "@/lib/gamification";
import type { StudyPack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const { setActivePackId } = useActivePack();
  const brainiac = useBrainiac();

  useEffect(() => {
    getDocument<StudyPack>("studyPacks", id).then(setPack);
  }, [id]);

  useEffect(() => {
    setActivePackId(id);
  }, [id, setActivePackId]);

  if (!pack) {
    return <div className="p-6 text-sm text-muted-foreground">Loading quiz...</div>;
  }

  const question = pack.quiz[index];

  function choose(choiceIndex: number) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    const correct = choiceIndex === question.correctIndex;
    if (correct) setCorrectCount((c) => c + 1);
    const feedback = quizFeedback(correct, index);
    toast(feedback);
    brainiac.show(correct ? "happy" : "error", feedback);
  }

  async function next() {
    const currentPack = pack;
    if (!currentPack) return;
    if (index + 1 < currentPack.quiz.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      return;
    }

    const finalCorrect = correctCount;
    const gained = xpForQuizResult(finalCorrect, currentPack.quiz.length);
    setXpGained(gained);
    setFinished(true);

    if (profile) {
      const streak = updateStreak(profile);
      const { xp, level, newBadges } = applyXp(profile.xp, profile.badges, gained);
      await updateProfile({ xp, level, badges: newBadges, ...streak });
    }
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RiTrophyLine className="size-8" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold">Quiz complete!</h1>
        <p className="text-sm text-muted-foreground">
          You scored {correctCount} out of {pack.quiz.length} and earned {xpGained} XP.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/pack/${id}`)}>
            Back to pack
          </Button>
          <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <div>
        <Progress
          value={((index + 1) / pack.quiz.length) * 100}
          className="h-2"
          aria-label={`Question ${index + 1} of ${pack.quiz.length}`}
        />
        <p className="mt-2 text-xs text-muted-foreground" aria-hidden="true">
          Question {index + 1} of {pack.quiz.length}
        </p>
      </div>

      <h1 className="text-lg font-medium">{question.question}</h1>

      <div className="flex flex-col gap-3">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          const showState = selected !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={selected !== null}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                showState && isCorrect && "border-green-500 bg-green-500/10",
                showState && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                !showState && "hover:border-primary",
              )}
            >
              {choice}
              {showState && isCorrect && (
                <>
                  <RiCheckLine className="size-4 text-green-600" aria-hidden />
                  <span className="sr-only">Correct</span>
                </>
              )}
              {showState && isSelected && !isCorrect && (
                <>
                  <RiCloseLine className="size-4 text-destructive" aria-hidden />
                  <span className="sr-only">Incorrect</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <Button onClick={next}>{index + 1 < pack.quiz.length ? "Next question" : "See results"}</Button>
      )}
    </div>
  );
}
