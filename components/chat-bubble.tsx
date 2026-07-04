"use client";

import { useState } from "react";
import { RiSparkling2Line, RiCloseLine, RiSendPlaneLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { chatReply } from "@/lib/mock-ai";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatBubble({ activeTopic }: { activeTopic?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! Ask me about anything you're studying." },
  ]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const reply = chatReply(trimmed, activeTopic);
    setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "assistant", text: reply }]);
    setInput("");
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
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              aria-label="Message the study assistant"
            />
            <Button type="submit" size="icon" aria-label="Send">
              <RiSendPlaneLine className="size-4" />
            </Button>
          </form>
        </Card>
      )}
      <Button
        size="icon"
        className="size-14 rounded-full shadow-xl"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle study assistant chat"
      >
        <RiSparkling2Line className="size-6" />
      </Button>
    </div>
  );
}
