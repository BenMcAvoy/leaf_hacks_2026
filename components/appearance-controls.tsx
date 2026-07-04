"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function subscribeNoop() {
  return () => {};
}

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function AppearanceControls() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>Theme</Label>
        <p className="text-xs text-muted-foreground">Choose how Leaf looks on this device.</p>
      </div>
      <div className="flex gap-1">
        {THEME_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={mounted && theme === option.value ? "default" : "outline"}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
