"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiLeafLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { getFriendlyErrorMessage } from "@/lib/firebase-errors";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, login, register } = useAuth();
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
    try {
      if (mode === "register") {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.replace("/");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-background to-muted p-6">
      <Card className="w-full max-w-sm border-none shadow-xl">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <RiLeafLine className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Log in to keep your streak going."
              : "Start studying smarter in under a minute."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
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
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={mode === "register" ? 6 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register" : "Log in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
