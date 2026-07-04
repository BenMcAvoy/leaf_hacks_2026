"use client";

import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { cn } from "@/lib/utils";

export interface SpeechInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

const SpeechInput = React.forwardRef<HTMLInputElement, SpeechInputProps>(
  ({ className, value, onValueChange, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as any) || internalRef;
    
    const { isListening, supported, startListening, stopListening } = useSpeechToText((text) => {
      const currentValue = resolvedRef.current?.value || "";
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      
      // Update the internal input value
      if (resolvedRef.current) {
        resolvedRef.current.value = newValue;
      }
      
      // Trigger onChange events if provided
      if (onValueChange) {
        onValueChange(newValue);
      }
      if (onChange) {
        // Create a synthetic event
        const event = {
          target: { value: newValue },
          currentTarget: { value: newValue }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    });

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <Input
          ref={resolvedRef}
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e);
            if (onValueChange) onValueChange(e.target.value);
          }}
          className={cn(supported ? "pr-10" : "", "w-full")}
          {...props}
        />
        {supported && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-1 h-7 w-7 text-muted-foreground hover:text-foreground",
              isListening && "text-red-500 hover:text-red-600 animate-pulse"
            )}
            onClick={(e) => {
              e.preventDefault();
              isListening ? stopListening() : startListening();
            }}
            title={isListening ? "Stop listening" : "Start dictation"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  }
);
SpeechInput.displayName = "SpeechInput";

export { SpeechInput };
