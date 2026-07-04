"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiHome5Line,
  RiHome5Fill,
  RiUploadCloud2Line,
  RiUploadCloud2Fill,
  RiTeamLine,
  RiTeamFill,
  RiUserLine,
  RiUserFill,
  RiLeafLine,
  RiFireFill,
  RiLogoutBoxRLine,
} from "@remixicon/react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  HomeActionProvider,
  useHomeAction,
} from "@/components/providers/home-action-provider";
import { HomeContent } from "@/components/home-content";
import { cn } from "@/lib/utils";

const HOME_PATH = "/dashboard";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: RiHome5Line, activeIcon: RiHome5Fill },
  { href: "/upload", label: "Add", icon: RiUploadCloud2Line, activeIcon: RiUploadCloud2Fill },
  { href: "/squads", label: "Squads", icon: RiTeamLine, activeIcon: RiTeamFill },
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
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105 group-active:scale-95",
              logoPulse && "home-logo-pulse",
            )}
          >
            <RiLeafLine className="size-4" />
          </div>
          <span className={cn("transition-opacity duration-200", logoPulse && "home-text-pulse")}>
            Leaf
          </span>
        </button>
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <RiFireFill className="size-4 text-orange-500" />
              {profile.streakCount}
            </div>
          )}
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
          className="pointer-events-auto flex items-center gap-1 rounded-[2rem] border border-border/40 bg-background/85 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = active ? item.activeIcon : item.icon;
            const isHome = item.href === HOME_PATH;

            const itemClass = cn(
              "relative flex flex-col items-center gap-0.5 rounded-[1.5rem] px-5 py-2 text-[11px] font-medium transition-all duration-200 select-none",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            );

            const content = (
              <>
                {active && (
                  <span className="absolute inset-0 rounded-[1.5rem] bg-primary/10" />
                )}
                <Icon className="relative size-[22px]" />
                <span className="relative leading-none">{item.label}</span>
              </>
            );

            if (isHome) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={goHome}
                  className={itemClass}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={itemClass}>
                {content}
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
