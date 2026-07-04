# Project Anatomy: leaf_hacks_2026

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Firebase 12 (Firestore, Analytics, Storage)
- shadcn/ui + Base UI
- Genkit + @genkit-ai/googleai (added, not yet wired up)

## Directory Structure
```
app/           Next.js App Router pages and layout
lib/           Shared utilities and service wrappers
  firebase.ts  Firebase app singleton (initializeApp)
  firestore.ts Firestore convenience wrapper (CRUD, subscriptions, queries)
  utils.ts     General utilities
```

## Key Files
- `lib/firebase.ts` — Firebase app + Analytics singleton
- `lib/firestore.ts` — Typed Firestore wrapper (getDocument, getCollection, setDocument, addDocument, updateDocument, deleteDocument, subscribeToDocument, subscribeToCollection)
- `firestore.rules` — Firestore security rules
- `firebase.json` — Firebase project config

## Conventions
- Firebase initialized as a lazy singleton in `lib/firebase.ts`
- Firestore accessed exclusively through `lib/firestore.ts` wrapper
- All Firestore documents are typed with generics; returned with `id` field injected
- No animation library (no framer-motion) - motion is hand-written CSS `@keyframes` in `app/globals.css` plus Tailwind `animate-*` utilities
- Reduced motion is a global CSS override: `AccessibilityProvider` toggles `html.reduce-motion`, and `globals.css` forces near-zero animation/transition durations for it - new animated components get reduced-motion support for free via plain CSS animation/transition, no `prefers-reduced-motion` hook needed
- `app/(app)/layout.tsx` is the authenticated app shell (ActivePackProvider > BrainiacProvider > NavShell > children + ChatBubble + BrainiacMascot); root `app/layout.tsx` covers marketing/auth/onboarding and wraps ThemeProvider > AuthProvider > AccessibilityProvider

## AI assistant / mascot components
- `components/chat-bubble.tsx` — floating AI study assistant widget, bottom-right, z-50
- `components/brainiac-mascot.tsx` + `components/providers/brainiac-provider.tsx` — "Brainiac" mascot: contextual pop-in character reacting to AI assistant state, bottom-left, z-40 (`useBrainiac()` hook: `show(mood, message?, durationMs?)`, `hide()`)

## Shared UI components (dedup pass 2026-07-04)
- `components/study-pack-list.tsx` — pack row list + empty state; used by dashboard "Recent packs" and `/packs`
- `components/accessibility-controls.tsx` — reduce motion / dyslexia font / low-stimulation / text size / line spacing; used by onboarding and profile
- `components/learning-style-selector.tsx` — 4-card learning style picker; used by onboarding and profile
- Prefer extending these shared components over re-implementing their views inline elsewhere

## Theming
- Light/dark tokens already fully defined in `app/globals.css` (`:root` = light, `.dark` = dark); `components/theme-provider.tsx` wraps `next-themes` (`attribute="class"`, `enableSystem`, `defaultTheme="light"` set in `app/layout.tsx`), plus a hidden `d` keyboard shortcut toggling light/dark
- `components/theme-toggle.tsx` — visible sun/moon icon button (quick light/dark toggle, same logic as the `d` hotkey), mounted in `components/nav-shell.tsx` header between the streak counter and logout button
- `components/appearance-controls.tsx` — full Light/Dark/System selector using `useTheme()` directly (theme is a client-only `next-themes`/localStorage concern, not part of the Firestore `UserProfile`); mounted in `app/(app)/profile/page.tsx` above the Accessibility section
- Both components use `useSyncExternalStore` for the SSR-mount guard instead of `useState`+`useEffect` (see buglog.json set-state-in-effect entry)
- No theme toggle exists on marketing/auth/onboarding routes (they don't use `NavShell`); only the authenticated app shell has one
