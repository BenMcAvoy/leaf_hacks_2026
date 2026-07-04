import { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "That email or password doesn't look right. Please try again.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/user-not-found": "We couldn't find an account with that email.",
  "auth/wrong-password": "That password doesn't match this account.",
  "auth/email-already-in-use": "An account with that email already exists. Try logging in instead.",
  "auth/weak-password": "Please choose a password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  "auth/requires-recent-login": "Please log in again to continue.",
  "storage/unauthorized": "You don't have permission to upload this file.",
  "storage/canceled": "The upload was canceled.",
  "storage/quota-exceeded": "Storage limit reached. Please try a smaller file.",
  "storage/retry-limit-exceeded": "The upload timed out. Please try again.",
};

export function getFriendlyErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
