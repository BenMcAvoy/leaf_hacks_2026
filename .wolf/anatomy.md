# Project Anatomy: leaf_hacks_2026

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Firebase 12 (Firestore, Analytics, Storage)
- shadcn/ui + Base UI

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
