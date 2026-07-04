"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ActivePackProvider } from "@/components/providers/active-pack-provider";
import { BrainiacProvider } from "@/components/providers/brainiac-provider";
import { NavShell } from "@/components/nav-shell";
import { ChatBubble } from "@/components/chat-bubble";
import { BrainiacMascot } from "@/components/brainiac-mascot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [loading, profile, router]);

  if (loading || !profile?.onboardingComplete) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <ActivePackProvider>
      <BrainiacProvider>
        <NavShell>
          {children}
          <ChatBubble />
          <BrainiacMascot />
        </NavShell>
      </BrainiacProvider>
    </ActivePackProvider>
  );
}
