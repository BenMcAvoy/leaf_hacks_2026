"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, loginWithEmail, registerWithEmail, signOut } from "@/lib/auth";
import { getDocument, setDocument, updateDocument, subscribeToDocument } from "@/lib/firestore";
import { defaultAccessibilitySettings, type UserProfile, defaultSensoryAndCognitiveProfile, defaultInterestProfile } from "@/lib/types";
import { useNeuroStore } from "@/lib/store/neuro-store";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function newProfile(uid: string, email: string): UserProfile {
  return {
    uid,
    email,
    displayName: email.split("@")[0],
    onboardingComplete: false,
    learningStyle: null,
    accessibility: defaultAccessibilitySettings,
    sensoryProfile: defaultSensoryAndCognitiveProfile,
    interestProfile: defaultInterestProfile,
    voiceModeEnabled: false,
    xp: 0,
    level: 1,
    streakCount: 0,
    streakFreezeAvailable: true,
    lastActiveDate: null,
    squadId: null,
    badges: [],
    basicInfo: { headline: "", bio: "", location: "" },
    experience: [],
    qualifications: [],
    languages: [],
    skills: [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubDoc = subscribeToDocument<UserProfile>("users", user.uid, (data) => {
      setProfile(data);
      if (data?.sensoryProfile) {
        useNeuroStore.getState().updateProfile(data.sensoryProfile);
      }
      if (data?.interestProfile) {
        useNeuroStore.getState().updateInterestProfile(data.interestProfile);
      }
      setLoading(false);
    });
    return unsubDoc;
  }, [user]);

  async function register(email: string, password: string) {
    const firebaseUser = await registerWithEmail(email, password);
    const profileData = newProfile(firebaseUser.uid, email);
    await setDocument<UserProfile>("users", firebaseUser.uid, profileData);
  }

  async function login(email: string, password: string) {
    const firebaseUser = await loginWithEmail(email, password);
    const existing = await getDocument<UserProfile>("users", firebaseUser.uid);
    if (!existing) {
      await setDocument<UserProfile>("users", firebaseUser.uid, newProfile(firebaseUser.uid, email));
    }
  }

  async function logout() {
    await signOut();
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!user) return;
    await updateDocument<UserProfile>("users", user.uid, data);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
