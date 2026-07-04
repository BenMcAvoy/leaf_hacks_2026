"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useHomeAction } from "@/components/providers/home-action-provider";

const HOME_PATH = "/dashboard";

export function HomeContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { homeSignal } = useHomeAction();
  const prevPath = useRef(pathname);
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (homeSignal === 0) return;
    if (reduceMotion) {
      void controls.set({ opacity: 1, y: 0 });
      return;
    }
    void controls.start({
      opacity: [0.72, 1],
      y: [6, 0],
      transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
    });
  }, [controls, homeSignal, reduceMotion]);

  useEffect(() => {
    const cameHome =
      (pathname === HOME_PATH || pathname?.startsWith(`${HOME_PATH}/`)) &&
      prevPath.current !== pathname &&
      !prevPath.current?.startsWith(HOME_PATH);

    if (cameHome && !reduceMotion) {
      void controls.start({
        opacity: [0, 1],
        y: [10, 0],
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      });
    }

    prevPath.current = pathname;
  }, [controls, pathname, reduceMotion]);

  return (
    <motion.div animate={controls} initial={false} className="min-h-full">
      {children}
    </motion.div>
  );
}
