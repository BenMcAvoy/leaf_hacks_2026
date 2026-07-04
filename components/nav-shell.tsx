"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  RiHome5Line,
  RiHome5Fill,
  RiUploadCloud2Line,
  RiUploadCloud2Fill,
  RiTeamLine,
  RiTeamFill,
  RiUserLine,
  RiUserFill,
  RiFireFill,
  RiLogoutBoxRLine,
} from "@remixicon/react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  HomeActionProvider,
  useHomeAction,
} from "@/components/providers/home-action-provider";
import { HomeContent } from "@/components/home-content";
import { ThemeToggle } from "@/components/theme-toggle";
import { StudyFlowLogo } from "@/components/study-flow-logo";
import { cn } from "@/lib/utils";

const HOME_PATH = "/dashboard";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: RiHome5Line, activeIcon: RiHome5Fill },
  { href: "/upload", label: "Learn", icon: RiUploadCloud2Line, activeIcon: RiUploadCloud2Fill },
  { href: "/squads", label: "Spheres", icon: RiTeamLine, activeIcon: RiTeamFill },
  { href: "/profile", label: "Profile", icon: RiUserLine, activeIcon: RiUserFill },
];

function NavShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const router = useRouter();
  const { goHome, logoPulse } = useHomeAction();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={goHome}
          aria-label="Go to home"
          className="group flex items-center gap-2 rounded-lg font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <motion.div
            animate={
              logoPulse
                ? { scale: [1, 0.88, 1.06, 1], rotate: [0, -10, 4, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.42, ease: [0.34, 1.4, 0.64, 1] }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex"
          >
            <StudyFlowLogo markClassName="size-8 rounded-lg" />
          </motion.div>
          <motion.span
            animate={logoPulse ? { opacity: [1, 0.7, 1], x: [0, -2, 0] } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.42, ease: [0.34, 1.4, 0.64, 1] }}
          >
            Study Flow
          </motion.span>
        </button>
        <div className="flex items-center gap-4">
          {profile && (
            <div
              className="flex items-center gap-1 text-sm text-muted-foreground"
              aria-label={`${profile.streakCount} day streak`}
            >
              <RiFireFill className="size-4 text-orange-500" aria-hidden />
              <span aria-hidden="true">{profile.streakCount}</span>
            </div>
          )}
          <ThemeToggle />
          <button
            onClick={async () => {
              await logout();
              router.replace("/auth");
            }}
            aria-label="Log out"
            className="text-muted-foreground hover:text-foreground"
          >
            <RiLogoutBoxRLine className="size-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-32">
        <HomeContent>{children}</HomeContent>
      </main>

      {/* One UI floating pill taskbar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-5 px-6 pointer-events-none">
        <nav
          aria-label="Main navigation"
          className="pointer-events-auto flex items-center gap-1 rounded-[2rem] border border-border/40 bg-background/85 px-3 py-2 backdrop-blur-xl"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = active ? item.activeIcon : item.icon;
            const isHome = item.href === HOME_PATH;

            const itemClass = cn(
              "relative flex flex-col items-center gap-0.5 rounded-[1.5rem] px-5 py-2 text-[11px] font-medium transition-all duration-200 select-none",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            );

            if (isHome) {
              return (
                <motion.button
                  key={item.href}
                  type="button"
                  onClick={goHome}
                  whileTap={{ scale: 0.94 }}
                  className={itemClass}
                >
                  {active && <span className="absolute inset-0 rounded-[1.5rem] bg-primary/10" />}
                  <motion.span
                    className="relative"
                    animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                  >
                    <Icon className="size-[22px]" />
                  </motion.span>
                  <span className="relative leading-none">{item.label}</span>
                </motion.button>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={itemClass}>
                {active && <span className="absolute inset-0 rounded-[1.5rem] bg-primary/10" />}
                <motion.span
                  className="relative"
                  animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Icon className="size-[22px]" />
                </motion.span>
                <span className="relative leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <HomeActionProvider>
      <NavShellInner>{children}</NavShellInner>
    </HomeActionProvider>
  );
}
