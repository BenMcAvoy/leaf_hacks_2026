import { SensoryAndCognitiveProfile } from "@/lib/types";

export type RewardType = "micro_quest_complete" | "level_up" | "streak_maintained";

type RewardCallback = (reward: RewardType, shouldPlaySound: boolean, shouldAnimate: boolean) => void;

export class MicroPacingEngine {
  private activeTimeMs: number = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<RewardCallback> = new Set();
  
  /**
   * Slices a large array of items (e.g., flashcards) into smaller micro-quests.
   */
  static chunkQuest<T>(items: T[], chunkSize: number): T[][] {
    if (chunkSize <= 0) return [items];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Starts tracking active cognitive time.
   */
  startTracking(onLimitReached?: () => void, limitMinutes = 25) {
    if (this.timer) return;
    
    // Tick every second
    this.timer = setInterval(() => {
      this.activeTimeMs += 1000;
      
      const activeMinutes = this.activeTimeMs / 60000;
      if (activeMinutes >= limitMinutes && onLimitReached) {
        onLimitReached();
        this.resetTracking(); // Wait for user to explicitly restart after break
      }
    }, 1000);
  }

  stopTracking() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  resetTracking() {
    this.stopTracking();
    this.activeTimeMs = 0;
  }

  getActiveTimeSeconds(): number {
    return Math.floor(this.activeTimeMs / 1000);
  }

  /**
   * Triggers a reward event to the UI, automatically scaling the intensity 
   * based on the user's visual stimulation limits.
   */
  triggerReward(type: RewardType, visualStimulation: SensoryAndCognitiveProfile["visualStimulation"]) {
    const shouldPlaySound = visualStimulation !== "low";
    const shouldAnimate = visualStimulation !== "low";
    
    // If stimulation is low, we might only play a very subtle haptic or nothing at all.
    // For standard/high, we can play full sounds and animations.

    this.listeners.forEach((listener) => listener(type, shouldPlaySound, shouldAnimate));
  }
  
  onReward(callback: RewardCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

// Export a singleton instance for global use if needed, 
// though components can also instantiate their own if they want localized timers.
export const globalMicroPacingEngine = new MicroPacingEngine();
