"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, loginWithEmail, registerWithEmail, signOut } from "@/lib/auth";
import { getDocument, setDocument, updateDocument, subscribeToDocument } from "@/lib/firestore";
import { defaultAccessibilitySettings, type UserProfile } from "@/lib/types";

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

const demoProfile: UserProfile = {
  uid: "demo-alex",
  email: "alex@studyflow.demo",
  displayName: "Alex",
  onboardingComplete: true,
  learningStyle: "picturePath",
  accessibility: defaultAccessibilitySettings,
  xp: 1620,
  level: 4,
  streakCount: 7,
  streakFreezeAvailable: true,
  lastActiveDate: null,
  squadId: "sphere-physics-bros",
  badges: ["First Steps", "Consistent", "Study Sphere Starter"],
  basicInfo: {
    headline: "A-Level Physics student",
    bio: "Learning Newton's laws with short visual explanations and practice questions.",
    location: "London",
  },
  experience: [{ title: "Study Sphere member", org: "Physics Bros", period: "This week" }],
  qualifications: [{ name: "GCSE Science", issuer: "Mock profile", year: "2025" }],
  languages: [{ name: "English", level: "Fluent" }],
  skills: ["Physics", "Flashcards", "Exam practice"],
};

function newProfile(uid: string, email: string): UserProfile {
  return {
    uid,
    email,
    displayName: email.split("@")[0],
    onboardingComplete: false,
    learningStyle: null,
    accessibility: defaultAccessibilitySettings,
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
        setProfile(demoProfile);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubDoc = subscribeToDocument<UserProfile>("users", user.uid, (data) => {
      setProfile(data);
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
    if (user) {
      await signOut();
    }
    setUser(null);
    setProfile(demoProfile);
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!user) {
      setProfile((current) => (current ? { ...current, ...data } : current));
      return;
    }
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
