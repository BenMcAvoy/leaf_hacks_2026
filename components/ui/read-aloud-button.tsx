"use client";

import { Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export interface ReadAloudButtonProps {
  text: string;
  className?: string;
}

export function ReadAloudButton({ text, className }: ReadAloudButtonProps) {
  const { profile } = useAuth();
  const { isPlaying, supported, speak, stop } = useTextToSpeech();

  if (!supported || !profile?.accessibility?.enableTTS) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", className)}
      onClick={() => {
        if (isPlaying) {
          stop();
        } else {
          speak(text);
        }
      }}
      title={isPlaying ? "Stop reading" : "Read aloud"}
    >
      {isPlaying ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
}
