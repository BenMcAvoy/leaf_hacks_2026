"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { RiSunLine, RiMoonLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

function subscribeNoop() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="size-8" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="text-muted-foreground hover:text-foreground"
    >
      {isDark ? <RiSunLine className="size-5" /> : <RiMoonLine className="size-5" />}
    </Button>
  );
}
