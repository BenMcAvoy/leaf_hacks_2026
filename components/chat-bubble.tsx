"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiSparkling2Line,
  RiCloseLine,
  RiSendPlaneLine,
  RiMicLine,
  RiMicOffLine,
  RiLoader4Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFriendlyErrorMessage } from "@/lib/firebase-errors";
import { useAuth } from "@/components/providers/auth-provider";
import { useActivePack } from "@/components/providers/active-pack-provider";
import { useBrainiac } from "@/components/providers/brainiac-provider";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! Ask me about anything you're studying." },
  ]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelFrameRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { user, profile } = useAuth();
  const { activePackId } = useActivePack();
  const brainiac = useBrainiac();
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (levelFrameRef.current) cancelAnimationFrame(levelFrameRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      audioContextRef.current?.close();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function toggleOpen() {
    if (!open) brainiac.show("greeting", "Need a hand studying?");
    setOpen((v) => !v);
  }

  async function sendPayload(
    body: { message?: string; audio?: { dataUrl: string; contentType: string } },
    optimisticUserText?: string,
  ) {
    const history = messages;
    if (optimisticUserText) setMessages((m) => [...m, { role: "user", text: optimisticUserText }]);
    setSending(true);
    brainiac.show("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          activePackId: activePackId ?? undefined,
          history,
          ...body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get a reply");
      if (!optimisticUserText && data.transcript) {
        setMessages((m) => [...m, { role: "user", text: data.transcript }]);
      }
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      brainiac.show("happy");
      if (data.navigateTo) {
        toast.success("Taking you there...");
        router.push(data.navigateTo);
      }
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "The study assistant couldn't respond. Please try again."));
      brainiac.show("error");
    } finally {
      setSending(false);
      setTranscribing(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setInput("");
    await sendPayload({ message: trimmed }, trimmed);
  }

  function watchAudioLevel(stream: MediaStream) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const level = data.reduce((sum, v) => sum + v, 0) / data.length / 255;
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        const scale = Math.min(1, 0.15 + level * (1 + i * 0.2));
        bar.style.transform = `scaleY(${scale})`;
      });
      levelFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  async function startRecording() {
    if (sending) return;
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm", audioBitsPerSecond: 128000 });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          setTranscribing(true);
          await sendPayload({ audio: { dataUrl: reader.result as string, contentType: "audio/webm" } });
        };
        reader.readAsDataURL(blob);
      };
      mr.start();
      setRecording(true);
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      watchAudioLevel(stream);
    } catch (err) {
      const denied = err instanceof Error && err.name === "NotAllowedError";
      toast.error(denied ? "Microphone access denied. Type your message instead." : "Could not start recording.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (levelFrameRef.current) cancelAnimationFrame(levelFrameRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }

  function formatElapsed(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6">
      {open && (
        <Card className="flex h-96 w-80 flex-col gap-0 overflow-hidden p-0 shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <RiSparkling2Line className="size-4 text-primary" />
              Study Assistant
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <RiCloseLine className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2"
                }
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex max-w-[85%] items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              </div>
            )}
          </div>
          {recording ? (
            <div className="flex items-center gap-3 border-t p-3">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                aria-label="Stop recording"
                onClick={stopRecording}
              >
                <RiMicOffLine className="size-4" />
              </Button>
              <div className="flex flex-1 items-center gap-2">
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                </span>
                <span className="text-xs text-muted-foreground">Listening...</span>
                <div className="flex h-5 flex-1 items-end justify-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      className="h-full w-1 origin-bottom rounded-full bg-destructive/70 transition-transform duration-75"
                      style={{ transform: "scaleY(0.15)" }}
                    />
                  ))}
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{formatElapsed(elapsedSeconds)}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
              {profile?.voiceModeEnabled && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Record voice message"
                  disabled={sending || transcribing}
                  onClick={startRecording}
                >
                  {transcribing ? (
                    <RiLoader4Line className="size-4 animate-spin" />
                  ) : (
                    <RiMicLine className="size-4" />
                  )}
                </Button>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                aria-label="Message the study assistant"
                disabled={sending || transcribing}
              />
              <Button type="submit" size="icon" aria-label="Send" disabled={sending || transcribing}>
                <RiSendPlaneLine className="size-4" />
              </Button>
            </form>
          )}
        </Card>
      )}
      <Button
        size="icon"
        className="size-14 rounded-full shadow-xl"
        onClick={toggleOpen}
        aria-label="Toggle study assistant chat"
      >
        <RiSparkling2Line className="size-6" />
      </Button>
    </div>
  );
}
