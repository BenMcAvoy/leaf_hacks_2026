import { create } from "zustand";
import { SensoryAndCognitiveProfile, defaultSensoryAndCognitiveProfile, InterestProfile, defaultInterestProfile } from "@/lib/types";

interface NeuroState {
  profile: SensoryAndCognitiveProfile;
  setReadingLevel: (level: SensoryAndCognitiveProfile["readingLevel"]) => void;
  setVisualStimulation: (level: SensoryAndCognitiveProfile["visualStimulation"]) => void;
  setUiComplexityLevel: (level: SensoryAndCognitiveProfile["uiComplexityLevel"]) => void;
  setCognitiveLoadLimit: (limit: number) => void;
  updateProfile: (partial: Partial<SensoryAndCognitiveProfile>) => void;
  interestProfile: InterestProfile;
  updateInterestProfile: (partial: Partial<InterestProfile>) => void;
}

export const useNeuroStore = create<NeuroState>((set) => ({
  profile: defaultSensoryAndCognitiveProfile,
  
  setReadingLevel: (level) =>
    set((state) => ({ profile: { ...state.profile, readingLevel: level } })),
    
  setVisualStimulation: (level) =>
    set((state) => ({ profile: { ...state.profile, visualStimulation: level } })),
    
  setUiComplexityLevel: (level) =>
    set((state) => ({ profile: { ...state.profile, uiComplexityLevel: level } })),
    
  setCognitiveLoadLimit: (limit) =>
    set((state) => ({ profile: { ...state.profile, cognitiveLoadLimit: limit } })),
    
  updateProfile: (partial) =>
    set((state) => ({ profile: { ...state.profile, ...partial } })),
    
  interestProfile: defaultInterestProfile,
  
  updateInterestProfile: (partial) =>
    set((state) => ({ interestProfile: { ...state.interestProfile, ...partial } })),
}));
