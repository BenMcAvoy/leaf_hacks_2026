"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RiSdCardLine,
  RiQuestionAnswerLine,
  RiCalendarScheduleLine,
  RiLightbulbFlashLine,
  RiFireFill,
  RiSendPlaneLine,
} from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import { subscribeToCollection, where, orderBy, limit } from "@/lib/firestore";
import { StudyPackList } from "@/components/study-pack-list";
import { MotionItem, MotionPage, MotionPress, MotionStagger } from "@/components/motion-primitives";
import { XP_PER_LEVEL, type StudyPack } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { key: "flashcards", label: "Make Flashcards", icon: RiSdCardLine, topicHint: "Flashcards: " },
  { key: "homework", label: "Hint First Help", icon: RiQuestionAnswerLine, topicHint: "Homework help: " },
  { key: "plan", label: "10 Minute Plan", icon: RiCalendarScheduleLine, topicHint: "Study plan: " },
  { key: "understand", label: "Reshape a Topic", icon: RiLightbulbFlashLine, topicHint: "" },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["S", "M", "T", "W", "T", "F", "S"];

function weekDays(): { label: string; fullName: string; isToday: boolean }[] {
  const today = new Date().getDay();
  return DAY_ABBR.map((label, i) => ({ label, fullName: DAY_NAMES[i], isToday: i === today }));
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const brainiac = useBrainiac();
  const [prompt, setPrompt] = useState("");
  const [recentPacks, setRecentPacks] = useState<(StudyPack & { id: string })[]>([]);
  const greetedRef = useRef(false);

  const xpIntoLevel = (profile?.xp ?? 0) % XP_PER_LEVEL;
  const xpProgress = (xpIntoLevel / XP_PER_LEVEL) * 100;

  useEffect(() => {
    if (greetedRef.current || !profile) return;
    greetedRef.current = true;
    brainiac.show("greeting", `Welcome back, ${profile.displayName}!`);
  }, [profile, brainiac]);

  useEffect(() => {
    if (!user) return;
    return subscribeToCollection<StudyPack>(
      "studyPacks",
      setRecentPacks,
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5),
    );
  }, [user]);

  function goToUpload(topic?: string) {
    const params = new URLSearchParams();
    if (topic) params.set("topic", topic);
    router.push(`/upload${params.toString() ? `?${params}` : ""}`);
  }

  function handlePromptSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    goToUpload(prompt.trim());
  }

  return (
    <MotionPage className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <MotionItem>
      <Card className="flex flex-col gap-4 border-none bg-gradient-to-br from-primary/90 to-primary p-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Welcome back</p>
            <h1 className="text-xl font-semibold">{profile?.displayName}</h1>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            <RiFireFill className="size-4" aria-hidden />
            {profile?.streakCount ?? 0} day streak
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs opacity-90">
            <span>Level {profile?.level ?? 1}</span>
            <span>{xpIntoLevel} / {XP_PER_LEVEL} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2 bg-white/20" />
        </div>
        <div className="flex justify-between pt-1" role="list" aria-label="Days of the week">
          {weekDays().map((day, i) => (
            <div
              key={`${day.label}-${i}`}
              role="listitem"
              aria-label={day.isToday ? `${day.fullName}, today` : day.fullName}
              aria-current={day.isToday ? "date" : undefined}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                day.isToday ? "bg-white text-primary" : "bg-white/15",
              )}
            >
              <span aria-hidden="true">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>
      </MotionItem>

      <MotionItem>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Learn Your Way</h2>
        <MotionStagger className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ key, label, icon: Icon, topicHint }) => (
            <MotionPress key={key}>
            <Card
              role="button"
              tabIndex={0}
              onClick={() => goToUpload(topicHint || undefined)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToUpload(topicHint || undefined); } }}
              className="flex cursor-pointer flex-col items-start gap-3 p-4 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Card>
            </MotionPress>
          ))}
        </MotionStagger>
      </MotionItem>

      <MotionItem>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Recent study packs</h2>
          <Link href="/packs" className="text-sm font-medium text-primary">
            View all
          </Link>
        </div>
        <StudyPackList
          packs={recentPacks}
          onEmptyAction={() => goToUpload()}
          emptyLabel="Generate your first one"
        />
      </MotionItem>

      <MotionItem>
      <form onSubmit={handlePromptSubmit} className="flex items-center gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to study today?"
          aria-label="Study prompt"
        />
        <Button type="submit" size="icon" aria-label="Generate">
          <RiSendPlaneLine className="size-4" />
        </Button>
      </form>
      </MotionItem>
    </MotionPage>
  );
}
