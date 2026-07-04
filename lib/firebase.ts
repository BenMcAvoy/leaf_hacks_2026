import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Analytics, isSupported, getAnalytics } from "firebase/analytics";
import { getAuth, browserLocalPersistence, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCuiNFR6rRAxsF_rUWGHXcZ6uexvfEr2JE",
  authDomain: "leaf-hacks-2026-8c860.firebaseapp.com",
  projectId: "leaf-hacks-2026-8c860",
  storageBucket: "leaf-hacks-2026-8c860.firebasestorage.app",
  messagingSenderId: "222296175793",
  appId: "1:222296175793:web:73a7d0a7f09d028bc11e90",
  measurementId: "G-DW3HNRLTXF",
};

export const firebaseApp: FirebaseApp =
  getApps()[0] ?? initializeApp(firebaseConfig);

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(firebaseApp);
    auth.setPersistence(browserLocalPersistence);
  }
  return auth;
}

let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) =>
      supported ? getAnalytics(firebaseApp) : null,
    );
  }
  return analyticsPromise;
}
