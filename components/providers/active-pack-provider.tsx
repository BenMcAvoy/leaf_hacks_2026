"use client";

import { createContext, useContext, useState } from "react";

interface ActivePackContextValue {
  activePackId: string | null;
  setActivePackId: (id: string | null) => void;
}

const ActivePackContext = createContext<ActivePackContextValue | null>(null);

export function ActivePackProvider({ children }: { children: React.ReactNode }) {
  const [activePackId, setActivePackId] = useState<string | null>(null);
  return (
    <ActivePackContext.Provider value={{ activePackId, setActivePackId }}>
      {children}
    </ActivePackContext.Provider>
  );
}

export function useActivePack(): ActivePackContextValue {
  const ctx = useContext(ActivePackContext);
  if (!ctx) throw new Error("useActivePack must be used within ActivePackProvider");
  return ctx;
}
