"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiImageLine,
  RiFileTextLine,
  RiStickyNoteLine,
  RiLinkM,
  RiSparkling2Line,
  RiCameraLine,
} from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SpeechInput } from "@/components/ui/speech-input";
import { Label } from "@/components/ui/label";
import { SpeechTextarea } from "@/components/ui/speech-textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import { addDocument, timestamp } from "@/lib/firestore";
import { uploadUserFile } from "@/lib/storage";
import { getFriendlyErrorMessage } from "@/lib/firebase-errors";
import type { StudyPack } from "@/lib/types";
import { toast } from "sonner";

function UploadContent() {
  const [source, setSource] = useState<StudyPack["sourceType"]>("notes");
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<{ url: string; contentType: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();
  const brainiac = useBrainiac();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected || !user) return;
    setUploading(true);
    try {
      setFile(await uploadUserFile(user.uid, selected));
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "We couldn't upload that file. Please try again.");
      toast.error(message);
      brainiac.show("error", message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const needsFile = source === "photo" || source === "file";
  const canGenerate = !!topic.trim() && !generating && !uploading && (!needsFile || !!file);

  async function handleGenerate() {
    if (!user || !canGenerate) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/study-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          sourceType: source,
          learningStyle: profile?.learningStyle ?? null,
          readingLevel: profile?.sensoryProfile?.readingLevel ?? "full_academic",
          interestProfile: profile?.interestProfile,
          notes: source === "notes" ? content : undefined,
          link: source === "link" ? content : undefined,
          fileUrl: needsFile ? file?.url : undefined,
          fileMimeType: needsFile ? file?.contentType : undefined,
        }),
      });
      const generated = await res.json();
      if (!res.ok) throw new Error(generated.error ?? "Failed to generate study pack");

      const packId = await addDocument<StudyPack>("studyPacks", {
        ownerId: user.uid,
        createdAt: timestamp(),
        ...generated,
      });
      router.push(`/pack/${packId}`);
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "We couldn't generate your study pack. Please try again.");
      toast.error(message);
      brainiac.show("error", message);
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
            <RiImageLine className="size-4" aria-hidden />
            <span className="sr-only">Photo</span>
          </TabsTrigger>
          <TabsTrigger value="file">
            <RiFileTextLine className="size-4" aria-hidden />
            <span className="sr-only">File</span>
          </TabsTrigger>
          <TabsTrigger value="notes">
            <RiStickyNoteLine className="size-4" aria-hidden />
            <span className="sr-only">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="link">
            <RiLinkM className="size-4" aria-hidden />
            <span className="sr-only">Link</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo">
          <Card className="flex flex-col items-center gap-3 border-dashed p-8 text-center">
            <RiImageLine className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium" id="photo-desc">Take a picture or upload a photo of your notes or textbook</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
                <RiCameraLine className="size-4" />
                Take a photo
              </Button>
              <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="w-auto" aria-label="Choose a photo to upload" aria-describedby="photo-desc" />
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            {uploading && <p className="text-xs text-muted-foreground" aria-live="polite">Uploading...</p>}
            {file && !uploading && <p className="text-xs text-muted-foreground" aria-live="polite">Photo uploaded.</p>}
          </Card>
        </TabsContent>
        <TabsContent value="file">
          <Card className="flex flex-col items-center gap-3 border-dashed p-8 text-center">
            <RiFileTextLine className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium" id="file-desc">Upload a PDF, Word doc, or text file</p>
            <Input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} disabled={uploading} aria-label="Choose a file to upload" aria-describedby="file-desc" />
            {uploading && <p className="text-xs text-muted-foreground" aria-live="polite">Uploading...</p>}
            {file && !uploading && <p className="text-xs text-muted-foreground" aria-live="polite">File uploaded.</p>}
          </Card>
        </TabsContent>
        <TabsContent value="notes">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Paste your notes</Label>
            <SpeechTextarea
              id="notes"
              rows={6}
              value={content}
              onValueChange={setContent}
              placeholder="Paste any notes, text, or material here..."
            />
          </div>
        </TabsContent>
        <TabsContent value="link">
          <div className="flex flex-col gap-2">
            <Label htmlFor="link">Paste a link</Label>
            <SpeechInput
              id="link"
              type="url"
              value={content}
              onValueChange={setContent}
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
        <SpeechInput
          id="topic"
          value={topic}
          onValueChange={setTopic}
          placeholder="e.g. Cellular Respiration"
        />
      </div>

      <Button onClick={handleGenerate} disabled={!canGenerate} size="lg" aria-busy={generating}>
        <RiSparkling2Line className="size-4" aria-hidden />
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
