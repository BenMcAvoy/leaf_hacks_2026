"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiFlashlightLine, RiTeamLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { MotionItem, MotionPage, MotionStagger } from "@/components/motion-primitives";
import { StudyFlowLogo } from "@/components/study-flow-logo";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "register" && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      toast.success("Demo profile ready.");
      router.replace("/dashboard");
      setSubmitting(false);
    }, 350);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-background to-muted p-6">
      <MotionPage className="w-full max-w-sm">
        <Card className="border-none shadow-xl">
          <CardHeader className="flex flex-col items-center gap-2 text-center">
            <MotionItem>
              <StudyFlowLogo markClassName="size-14 rounded-2xl shadow-md" />
            </MotionItem>
            <h1 className="text-xl font-semibold">
              {mode === "login" ? "Study Flow" : "Mock sign in"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Learn Your Way with personalised study packs, quizzes and Study Spheres."
                : "Optional account flow for the demo. You can skip this and explore instantly."}
            </p>
          </CardHeader>
          <CardContent>
            <MotionStagger>
              {mode === "login" && (
                <MotionItem className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-2xl bg-muted p-3">
                    <RiFlashlightLine className="mb-2 size-4 text-primary" />
                    Gemini reshapes the same lesson for different learning modes.
                  </div>
                  <div className="rounded-2xl bg-muted p-3">
                    <RiTeamLine className="mb-2 size-4 text-primary" />
                    Study Spheres keep progress social, fair and motivating.
                  </div>
                </MotionItem>
              )}
              {mode === "login" && (
                <MotionItem>
                  <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
                    Get Started
                  </Button>
                </MotionItem>
              )}
              {mode !== "login" && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <MotionItem className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </MotionItem>
                  <MotionItem className="flex flex-col gap-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                      id="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </MotionItem>
                  <MotionItem>
                    <Button type="submit" disabled={submitting} className="mt-2 w-full">
                      {submitting ? "Please wait..." : "Register"}
                    </Button>
                  </MotionItem>
                </form>
              )}
              <MotionItem className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? "I already have an account?" : "Back to the demo?"}{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-4"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                >
                  {mode === "login" ? "Use mock auth" : "Landing"}
                </button>
              </MotionItem>
            </MotionStagger>
          </CardContent>
        </Card>
      </MotionPage>
    </div>
  );
}
