import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "@/lib/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(value: unknown): string {
  if (!(value instanceof Timestamp)) return ""
  const date = value.toDate()
  const diffDays = Math.round((date.getTime() - Date.now()) / 86_400_000)
  if (Math.abs(diffDays) < 1) return "Today"
  if (Math.abs(diffDays) < 7) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffDays, "day")
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
