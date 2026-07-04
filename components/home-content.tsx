"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useHomeAction } from "@/components/providers/home-action-provider";

const HOME_PATH = "/dashboard";

export function HomeContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { homeSignal } = useHomeAction();
  const contentRef = useRef<HTMLDivElement>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || homeSignal === 0) return;
    el.classList.remove("home-settle");
    void el.offsetWidth;
    el.classList.add("home-settle");
  }, [homeSignal]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const cameHome =
      (pathname === HOME_PATH || pathname?.startsWith(`${HOME_PATH}/`)) &&
      prevPath.current !== pathname &&
      !prevPath.current?.startsWith(HOME_PATH);

    if (cameHome) {
      el.classList.remove("home-enter");
      void el.offsetWidth;
      el.classList.add("home-enter");
    }

    prevPath.current = pathname;
  }, [pathname]);

  return (
    <div ref={contentRef} className={cn("min-h-full")}>
      {children}
    </div>
  );
}
