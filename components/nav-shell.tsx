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
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: RiHome5Line, activeIcon: RiHome5Fill },
  { href: "/upload", label: "Add", icon: RiUploadCloud2Line, activeIcon: RiUploadCloud2Fill },
  { href: "/squads", label: "Squads", icon: RiTeamLine, activeIcon: RiTeamFill },
  { href: "/profile", label: "Profile", icon: RiUserLine, activeIcon: RiUserFill },
];

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <RiLeafLine className="size-4" />
          </div>
          Leaf
        </div>
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

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 py-2 backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = active ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-1 text-xs",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
