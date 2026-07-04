"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RiCheckLine, RiCloseLine, RiTrophyLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useActivePack } from "@/components/providers/active-pack-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import { getDocument } from "@/lib/firestore";
import { quizFeedback } from "@/lib/quiz-feedback";
import { xpForQuizResult, updateStreak, applyXp } from "@/lib/gamification";
import { MotionItem, MotionPage, MotionPress, MotionStagger } from "@/components/motion-primitives";
import { MOCK_STUDY_PACK } from "@/lib/mock-data";
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
    async function loadPack() {
      if (id === "demo-newtons-laws") {
        const stored = window.sessionStorage.getItem("study-flow-demo-pack");
        setPack(stored ? (JSON.parse(stored) as StudyPack) : MOCK_STUDY_PACK);
        return;
      }
      const data = await getDocument<StudyPack>("studyPacks", id);
      setPack(data ?? MOCK_STUDY_PACK);
    }

    void loadPack();
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
      <MotionPage className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <motion.div
          initial={{ scale: 0.75, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <RiTrophyLine className="size-8" aria-hidden />
        </motion.div>
        <MotionItem>
          <h1 className="text-xl font-semibold">Quiz complete!</h1>
        </MotionItem>
        <MotionItem className="text-sm text-muted-foreground">
          You scored {correctCount} out of {pack.quiz.length} and earned {xpGained} XP.
        </MotionItem>
        <MotionItem className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/pack/${id}`)}>
            Back to pack
          </Button>
          <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
        </MotionItem>
      </MotionPage>
    );
  }

  return (
    <MotionPage className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <MotionItem>
        <Progress
          value={((index + 1) / pack.quiz.length) * 100}
          className="h-2"
          aria-label={`Question ${index + 1} of ${pack.quiz.length}`}
        />
        <p className="mt-2 text-xs text-muted-foreground" aria-hidden="true">
          Question {index + 1} of {pack.quiz.length}
        </p>
      </MotionItem>

      <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col gap-6"
      >
      <h1 className="text-lg font-medium">{question.question}</h1>

      <MotionStagger className="flex flex-col gap-3">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          const showState = selected !== null;
          return (
            <motion.button
              key={`${question.question}-${choice}`}
              onClick={() => choose(i)}
              disabled={selected !== null}
              whileHover={!showState ? { x: 3 } : undefined}
              whileTap={!showState ? { scale: 0.99 } : undefined}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                showState && isCorrect && "border-green-500 bg-green-500/10",
                showState && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                !showState && "hover:border-primary",
              )}
            >
              {choice}
              <AnimatePresence>
                {showState && isCorrect && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <RiCheckLine className="size-4 text-green-600" aria-hidden />
                    <span className="sr-only">Correct</span>
                  </motion.span>
                )}
                {showState && isSelected && !isCorrect && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <RiCloseLine className="size-4 text-destructive" aria-hidden />
                    <span className="sr-only">Incorrect</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </MotionStagger>
      </motion.div>
      </AnimatePresence>

      {selected !== null && (
        <MotionPress>
        <Button onClick={next}>{index + 1 < pack.quiz.length ? "Next question" : "See results"}</Button>
        </MotionPress>
      )}
    </MotionPage>
  );
}
