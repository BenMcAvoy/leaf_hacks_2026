# Project Anatomy: leaf_hacks_2026

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Firebase 12 (Firestore, Analytics, Storage)
- shadcn/ui + Base UI
- Genkit + @genkit-ai/googleai (fully wired: study pack generation, chat, definition grading, TTS)

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
- `lib/genkit.ts` — Genkit singleton (ai, flashModel = gemini-2.5-flash-lite, ttsModel = gemini-2.5-flash-preview-tts)
- `lib/ai.ts` — Gemini AI functions: generateStudyPack, chatReply (both use withRetry), gradeDefinitionAnswer (Gemini grades free-text/audio answers), synthesizeSpeech (Gemini TTS returning WAV base64)
- `lib/audio.ts` — pcmBase64ToWavBase64 utility: wraps raw Gemini PCM output in a WAV header for browser playback
- `firestore.rules` — Firestore security rules
- `firebase.json` — Firebase project config

## API routes
- `app/api/study-pack/route.ts` — POST, generates a study pack via Gemini
- `app/api/chat/route.ts` — POST, chat assistant reply via Gemini
- `app/api/quiz/grade-definition/route.ts` — POST, grades a typed or spoken definition-mode answer via Gemini
- `app/api/quiz/speak/route.ts` — POST, synthesizes speech for a definition via Gemini TTS, returns WAV base64

## Upload page
- `app/(app)/upload/page.tsx` photo tab has two ways to supply an image: a hidden `<input type="file" accept="image/*" capture="environment">` triggered by a "Take a photo" button (opens the device camera directly on mobile) and the existing plain `<input type="file" accept="image/*">` for picking from the gallery/library; both share the same `handleFileChange` -> `uploadUserFile`

## Quiz modes
- `app/(app)/pack/[id]/quiz/page.tsx` — MCQ mode: Gemini-generated multiple choice, graded client-side by index
- `app/(app)/pack/[id]/quiz/define/page.tsx` — Definition mode: shows flashcard.back, user types or speaks flashcard.front, Gemini grades with tolerance for synonyms/typos. Supports optional voice mode (TTS reads definition, STT records spoken answer via MediaRecorder then sends audio to grade endpoint).

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

## Voice mode
- `UserProfile.voiceModeEnabled: boolean` (defaults false, persisted to Firestore via updateProfile) controls voice mode for definition quizzes
- Toggle exposed in `app/(app)/profile/page.tsx` under "Voice mode" section using `Switch` + `Label` from shadcn/ui
- In definition quiz: TTS calls `POST /api/quiz/speak`; STT records via `MediaRecorder` (audio/webm), converts to data URL via `FileReader`, sends to `POST /api/quiz/grade-definition` with `answerAudio`; Gemini transcribes + grades in one call
- Voice TTS/STT uses Gemini AI not browser Web Speech API; graceful fallback to text input on mic permission denial or TTS failure

## Chat assistant voice input + navigation
- `components/chat-bubble.tsx` mic button (input row, left of text field) shown only when `profile?.voiceModeEnabled`; reuses the same MediaRecorder audio/webm -> base64 dataUrl -> FileReader pattern as the definition quiz, no new STT code
- `send`/mic both funnel through a shared `sendPayload({ message?, audio? }, optimisticUserText?)` in chat-bubble.tsx that POSTs to `/api/chat`, appends transcript as a user bubble when audio was sent, and calls `router.push` (from `next/navigation`) when the response includes `navigateTo`
- `lib/ai.ts` `chatReply` now returns `{ reply, navigateTo, transcript? }` (Genkit `z` structured `output: { schema }`, matching `generateStudyPack`/`gradeDefinitionAnswer`) instead of a plain string; accepts optional `audio: { url, contentType }` folded into the same Gemini call (transcribe + reply + nav-intent in one request, no separate `/api/transcribe` route)
- `navigateTo` is a closed Zod enum `CHAT_NAV_TARGETS` (`dashboard | upload | packs | squads | profile | active_pack | pack`) exported from `lib/ai.ts`; the model can never emit a free-form path. When `navigateTo === "pack"` the model also returns `packId` (must match an id shown `[id: ...]` in the prompt's pack list, which is sorted most-recent-first so "latest/newest deck" = the first id in that list). `resolveChatNavRoute(target, activePackId, packId, validPackIds)` (also `lib/ai.ts`) turns the enum into an actual URL server-side in `app/api/chat/route.ts`, validating `packId` against the already ownership-checked pack list (falls back to `/packs` if invalid/missing) - the client only ever receives a ready path string or null
- `app/api/chat/route.ts` request body now accepts `message` (optional) OR `audio: { dataUrl, contentType }`; response is `{ reply, navigateTo, transcript }`
- Mic recording UI in chat-bubble.tsx: while `recording`, the input form is replaced with a live "Listening..." row (pulsing dot, 5 bars driven by a Web Audio `AnalyserNode` on the mic stream via a `requestAnimationFrame` loop that writes `transform: scaleY()` directly to bar DOM refs rather than React state, elapsed mm:ss timer via `setInterval`). `getUserMedia` requests `echoCancellation`/`noiseSuppression`/`autoGainControl` and `MediaRecorder` sets `audioBitsPerSecond: 128000` for cleaner audio; the chatReply transcription prompt in lib/ai.ts explicitly tells Gemini to use the user's study pack topics/terms as context to resolve ambiguous words and transcribe verbatim (no paraphrasing)

## Theming
- Light/dark tokens already fully defined in `app/globals.css` (`:root` = light, `.dark` = dark); `components/theme-provider.tsx` wraps `next-themes` (`attribute="class"`, `enableSystem`, `defaultTheme="light"` set in `app/layout.tsx`), plus a hidden `d` keyboard shortcut toggling light/dark
- `components/theme-toggle.tsx` — visible sun/moon icon button (quick light/dark toggle, same logic as the `d` hotkey), mounted in `components/nav-shell.tsx` header between the streak counter and logout button
- `components/appearance-controls.tsx` — full Light/Dark/System selector using `useTheme()` directly (theme is a client-only `next-themes`/localStorage concern, not part of the Firestore `UserProfile`); mounted in `app/(app)/profile/page.tsx` above the Accessibility section
- Both components use `useSyncExternalStore` for the SSR-mount guard instead of `useState`+`useEffect` (see buglog.json set-state-in-effect entry)
- No theme toggle exists on marketing/auth/onboarding routes (they don't use `NavShell`); only the authenticated app shell has one
