import {
  createUserWithEmailAndPassword,
  onAuthStateChanged as _onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as _signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await _signOut(getFirebaseAuth());
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return _onAuthStateChanged(getFirebaseAuth(), callback);
}
