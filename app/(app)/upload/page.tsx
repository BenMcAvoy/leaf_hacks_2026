"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiImageLine, RiFileTextLine, RiStickyNoteLine, RiLinkM, RiSparkling2Line } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { addDocument } from "@/lib/firestore";
import { generateStudyPack } from "@/lib/mock-ai";
import { timestamp } from "@/lib/firestore";
import type { StudyPack } from "@/lib/types";

function UploadContent() {
  const [source, setSource] = useState<StudyPack["sourceType"]>("notes");
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();

  async function handleGenerate() {
    if (!user || !topic.trim()) return;
    setGenerating(true);
    try {
      const generated = generateStudyPack(topic.trim(), source, profile?.learningStyle ?? null);
      const packId = await addDocument<StudyPack>("studyPacks", {
        ownerId: user.uid,
        createdAt: timestamp(),
        ...generated,
      });
      router.push(`/pack/${packId}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-semibold">Add material</h1>
        <p className="text-sm text-muted-foreground">
          Upload something to study, and we will turn it into a full study pack.
        </p>
      </div>

      <Tabs value={source} onValueChange={(v) => setSource(v as StudyPack["sourceType"])}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="photo">
            <RiImageLine className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="file">
            <RiFileTextLine className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="notes">
            <RiStickyNoteLine className="size-4" />
          </TabsTrigger>
          <TabsTrigger value="link">
            <RiLinkM className="size-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo">
          <Card className="flex flex-col items-center gap-3 border-dashed p-8 text-center">
            <RiImageLine className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Upload a photo of your notes or textbook</p>
            <Input type="file" accept="image/*" />
          </Card>
        </TabsContent>
        <TabsContent value="file">
          <Card className="flex flex-col items-center gap-3 border-dashed p-8 text-center">
            <RiFileTextLine className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Upload a PDF, Word doc, or text file</p>
            <Input type="file" accept=".pdf,.doc,.docx,.txt" />
          </Card>
        </TabsContent>
        <TabsContent value="notes">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Paste your notes</Label>
            <Textarea
              id="notes"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste any notes, text, or material here..."
            />
          </div>
        </TabsContent>
        <TabsContent value="link">
          <div className="flex flex-col gap-2">
            <Label htmlFor="link">Paste a link</Label>
            <Input
              id="link"
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              If the link requires a login, a screenshot or file upload will work better.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-2">
        <Label htmlFor="topic">Topic name</Label>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Cellular Respiration"
        />
      </div>

      <Button onClick={handleGenerate} disabled={!topic.trim() || generating} size="lg">
        <RiSparkling2Line className="size-4" />
        {generating ? "Generating..." : "Generate Study Pack"}
      </Button>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
