"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function useTextToSpeech() {
  const { profile } = useAuth();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (profile?.accessibility.ttsVoiceUri) {
        const preferredVoice = voices.find((v) => v.voiceURI === profile.accessibility.ttsVoiceUri);
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setCurrentUtterance(utterance);
      window.speechSynthesis.speak(utterance);
    },
    [supported, voices, profile]
  );

  const stop = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentUtterance(null);
    }
  }, [supported]);

  const pause = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (supported && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, [supported]);

  return {
    voices,
    isPlaying,
    supported,
    speak,
    stop,
    pause,
    resume,
  };
}
