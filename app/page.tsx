"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function Page() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [profile, loading, router]);

  return null;
}
