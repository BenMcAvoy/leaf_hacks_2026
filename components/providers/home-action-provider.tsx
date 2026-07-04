"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const HOME_PATH = "/dashboard";

interface HomeActionContextValue {
  goHome: () => void;
  homeSignal: number;
  logoPulse: boolean;
}

const HomeActionContext = createContext<HomeActionContextValue | null>(null);

export function HomeActionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [homeSignal, setHomeSignal] = useState(0);
  const [logoPulse, setLogoPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goHome = useCallback(() => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setLogoPulse(true);
    pulseTimer.current = setTimeout(() => setLogoPulse(false), 420);

    const onHome = pathname === HOME_PATH || pathname?.startsWith(`${HOME_PATH}/`);

    if (onHome) {
      setHomeSignal((n) => n + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push(HOME_PATH);
  }, [pathname, router]);

  return (
    <HomeActionContext.Provider value={{ goHome, homeSignal, logoPulse }}>
      {children}
    </HomeActionContext.Provider>
  );
}

export function useHomeAction() {
  const ctx = useContext(HomeActionContext);
  if (!ctx) {
    throw new Error("useHomeAction must be used within HomeActionProvider");
  }
  return ctx;
}
