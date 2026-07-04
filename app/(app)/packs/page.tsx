"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeToCollection, where, orderBy, limit } from "@/lib/firestore";
import { StudyPackList } from "@/components/study-pack-list";
import type { StudyPack } from "@/lib/types";

export default function PacksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [packs, setPacks] = useState<(StudyPack & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToCollection<StudyPack>(
      "studyPacks",
      setPacks,
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50),
    );
  }, [user]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Your study packs</h1>
      <StudyPackList packs={packs} onEmptyAction={() => router.push("/upload")} />
    </div>
  );
}
