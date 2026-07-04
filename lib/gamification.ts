import { BADGE_UNLOCKS, levelFromXp, type UserProfile } from "./types";

const BASE_XP_PER_QUESTION = 20;

export function xpForQuizResult(correctCount: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  const accuracy = correctCount / totalQuestions;
  const difficultyMultiplier = 1 + accuracy;
  return Math.round(correctCount * BASE_XP_PER_QUESTION * difficultyMultiplier);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export interface StreakUpdate {
  streakCount: number;
  streakFreezeAvailable: boolean;
  lastActiveDate: string;
}

export function updateStreak(profile: Pick<UserProfile, "streakCount" | "streakFreezeAvailable" | "lastActiveDate">): StreakUpdate {
  const today = todayKey();
  if (!profile.lastActiveDate) {
    return { streakCount: 1, streakFreezeAvailable: profile.streakFreezeAvailable, lastActiveDate: today };
  }

  const gap = daysBetween(profile.lastActiveDate, today);

  if (gap === 0) {
    return {
      streakCount: profile.streakCount,
      streakFreezeAvailable: profile.streakFreezeAvailable,
      lastActiveDate: today,
    };
  }

  if (gap === 1) {
    return {
      streakCount: profile.streakCount + 1,
      streakFreezeAvailable: profile.streakFreezeAvailable,
      lastActiveDate: today,
    };
  }

  if (gap === 2 && profile.streakFreezeAvailable) {
    return { streakCount: profile.streakCount + 1, streakFreezeAvailable: false, lastActiveDate: today };
  }

  return { streakCount: 1, streakFreezeAvailable: true, lastActiveDate: today };
}

export interface XpApplyResult {
  xp: number;
  level: number;
  newBadges: string[];
}

export function applyXp(currentXp: number, currentBadges: string[], gained: number): XpApplyResult {
  const xp = currentXp + gained;
  const level = levelFromXp(xp);
  const unlocked = BADGE_UNLOCKS.filter((b) => b.level <= level).map((b) => b.badge);
  const newBadges = unlocked.filter((b) => !currentBadges.includes(b));
  return { xp, level, newBadges: [...currentBadges, ...newBadges] };
}
