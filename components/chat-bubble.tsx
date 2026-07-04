"use client";

import { useEffect, useRef, useState } from "react";
import { RiSparkling2Line, RiCloseLine, RiSendPlaneLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatBubble({ activeTopic }: { activeTopic?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! Ask me about anything you're studying." },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      toggleRef.current?.focus();
    }
  }, [open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, topic: activeTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get a reply");
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get a reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6">
      {open && (
        <Card
          role="dialog"
          aria-label="Study assistant"
          aria-modal="true"
          className="flex h-96 w-80 flex-col gap-0 overflow-hidden p-0 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <RiSparkling2Line className="size-4 text-primary" aria-hidden />
              Study Assistant
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <RiCloseLine className="size-4" aria-hidden />
            </button>
          </div>
          <div
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Chat messages"
            className="flex-1 space-y-3 overflow-y-auto p-4 text-sm"
          >
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
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-muted-foreground">
                Thinking...
              </div>
            )}
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              aria-label="Message the study assistant"
              disabled={sending}
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={sending}>
              <RiSendPlaneLine className="size-4" aria-hidden />
            </Button>
          </form>
        </Card>
      )}
      <Button
        ref={toggleRef}
        size="icon"
        className="size-14 rounded-full shadow-xl"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle study assistant chat"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <RiSparkling2Line className="size-6" aria-hidden />
      </Button>
    </div>
  );
}
