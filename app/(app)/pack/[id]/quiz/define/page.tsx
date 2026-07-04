"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RiCheckLine,
  RiCloseLine,
  RiTrophyLine,
  RiMicLine,
  RiMicOffLine,
  RiVolumeUpLine,
  RiLoader4Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { useActivePack } from "@/components/providers/active-pack-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import { getDocument } from "@/lib/firestore";
import { xpForQuizResult, updateStreak, applyXp } from "@/lib/gamification";
import { FlashcardAdapter } from "@/lib/adapters/flashcard-adapter";
import type { StudyPack } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Phase = "answering" | "grading" | "graded";
type GradeResult = { correct: boolean; feedback: string; transcript?: string };

export default function DefineQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { setActivePackId } = useActivePack();
  const brainiac = useBrainiac();

  const [pack, setPack] = useState<StudyPack | null>(null);
  const [index, setIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingReady, setRecordingReady] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedAudioRef = useRef<{ dataUrl: string; contentType: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getDocument<StudyPack>("studyPacks", id).then((data) => {
      if (!data) return;
      setPack({ ...data, flashcards: FlashcardAdapter.normalizeFlashcards(data.flashcards) });
    });
  }, [id]);

  useEffect(() => {
    setActivePackId(id);
  }, [id, setActivePackId]);

  if (!pack) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (pack.flashcards.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">This pack has no flashcards for definition mode.</p>
        <Button variant="outline" onClick={() => router.push(`/pack/${id}`)}>
          Back to pack
        </Button>
      </div>
    );
  }

  const card = pack.flashcards[index];
  const voiceEnabled = profile?.voiceModeEnabled ?? false;

  async function playDefinition() {
    setTtsLoading(true);
    try {
      const res = await fetch("/api/quiz/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: card.content.back }),
      });
      if (!res.ok) throw new Error("TTS request failed");
      const { audioBase64, mimeType } = (await res.json()) as { audioBase64: string; mimeType: string };
      const src = `data:${mimeType};base64,${audioBase64}`;
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = src;
      await audioRef.current.play();
    } catch {
      toast("Could not play audio. The definition is shown above.");
    } finally {
      setTtsLoading(false);
    }
  }

  async function startRecording() {
    setRecordError(null);
    setRecordingReady(false);
    recordedAudioRef.current = null;
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          recordedAudioRef.current = {
            dataUrl: reader.result as string,
            contentType: "audio/webm",
          };
          setRecordingReady(true);
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      setRecording(true);
    } catch (err) {
      const denied = err instanceof Error && err.name === "NotAllowedError";
      setRecordError(
        denied
          ? "Microphone access denied. Type your answer instead."
          : "Could not start recording. Type your answer instead.",
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function submit() {
    const hasText = answerText.trim().length > 0;
    const hasAudio = recordingReady && recordedAudioRef.current !== null;
    if (!hasText && !hasAudio) return;

    setPhase("grading");

    const body = hasAudio
      ? { term: card.content.front, definition: card.content.back, answerAudio: recordedAudioRef.current }
      : { term: card.content.front, definition: card.content.back, answerText: answerText.trim() };

    try {
      const res = await fetch("/api/quiz/grade-definition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Grade request failed");
      const data = (await res.json()) as GradeResult;
      setResult(data);
      setPhase("graded");
      if (data.correct) setCorrectCount((c) => c + 1);
      toast(data.feedback);
      brainiac.show(data.correct ? "happy" : "error", data.feedback);
    } catch {
      toast.error("Grading failed. Please try again.");
      setPhase("answering");
    }
  }

  async function next() {
    if (index + 1 < pack!.flashcards.length) {
      setIndex((i) => i + 1);
      setAnswerText("");
      setResult(null);
      setPhase("answering");
      setRecordingReady(false);
      recordedAudioRef.current = null;
      return;
    }

    const gained = xpForQuizResult(correctCount, pack!.flashcards.length);
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
          <RiTrophyLine className="size-8" />
        </div>
        <h1 className="text-xl font-semibold">Quiz complete!</h1>
        <p className="text-sm text-muted-foreground">
          You scored {correctCount} out of {pack.flashcards.length} and earned {xpGained} XP.
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
        <Progress value={((index + 1) / pack.flashcards.length) * 100} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          Card {index + 1} of {pack.flashcards.length}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Definition
        </p>
        <Card className="p-4">
          <p className="text-sm leading-relaxed">{card.content.back}</p>
        </Card>
        {voiceEnabled && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={playDefinition}
            disabled={ttsLoading || phase === "grading"}
          >
            {ttsLoading ? (
              <RiLoader4Line className="size-4 animate-spin" />
            ) : (
              <RiVolumeUpLine className="size-4" />
            )}
            <span className="ml-1">{ttsLoading ? "Loading..." : "Play definition"}</span>
          </Button>
        )}
      </div>

      <p className="text-sm font-medium">What term matches this definition?</p>

      {phase === "graded" && result ? (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm",
            result.correct
              ? "border-green-500 bg-green-500/10"
              : "border-destructive bg-destructive/10",
          )}
        >
          <div className="flex items-center gap-2 font-medium">
            {result.correct ? (
              <RiCheckLine className="size-4 text-green-600" />
            ) : (
              <RiCloseLine className="size-4 text-destructive" />
            )}
            {result.correct ? "Correct" : "Incorrect"}
          </div>
          <p className="text-muted-foreground">{result.feedback}</p>
          {result.transcript && (
            <p className="text-xs text-muted-foreground">You said: &ldquo;{result.transcript}&rdquo;</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {voiceEnabled && (
            <div className="flex items-center gap-3">
              <Button
                variant={recording ? "destructive" : "outline"}
                size="sm"
                onClick={recording ? stopRecording : startRecording}
                disabled={phase === "grading"}
              >
                {recording ? (
                  <RiMicOffLine className="size-4" />
                ) : (
                  <RiMicLine className="size-4" />
                )}
                <span className="ml-1">{recording ? "Stop recording" : "Record answer"}</span>
              </Button>
              {recordingReady && !recording && (
                <span className="text-xs text-muted-foreground">Recording ready</span>
              )}
            </div>
          )}
          {recordError && <p className="text-xs text-destructive">{recordError}</p>}
          <Input
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && phase === "answering") void submit();
            }}
            placeholder="Type your answer..."
            disabled={phase === "grading"}
          />
        </div>
      )}

      {phase === "answering" && (
        <Button onClick={() => void submit()} disabled={!answerText.trim() && !recordingReady}>
          Submit
        </Button>
      )}

      {phase === "grading" && (
        <Button disabled>
          <RiLoader4Line className="mr-2 size-4 animate-spin" /> Grading...
        </Button>
      )}

      {phase === "graded" && (
        <Button onClick={() => void next()}>
          {index + 1 < pack.flashcards.length ? "Next card" : "See results"}
        </Button>
      )}
    </div>
  );
}
