"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ActivePackProvider } from "@/components/providers/active-pack-provider";
import { NavShell } from "@/components/nav-shell";
import { ChatBubble } from "@/components/chat-bubble";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth");
    } else if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [loading, user, profile, router]);

  if (loading || !user || !profile?.onboardingComplete) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <ActivePackProvider>
      <NavShell>
        {children}
        <ChatBubble />
      </NavShell>
    </ActivePackProvider>
  );
}
