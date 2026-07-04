<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Text and iconography

- Never use Unicode characters (emoji, symbols, special glyphs) in code, UI copy, or commit messages. Use plain ASCII text instead.
- Always prioritize component icons (e.g. lucide-react, an icon library already in the project) over Unicode characters when a visual glyph is needed.
- Never use em dashes (—) in any generated text. Use a comma, colon, or period instead.

## React best practices

- Keep components small and focused on one responsibility; extract logic into hooks rather than growing a single component.
- Prefer Server Components by default in the App Router; only add `"use client"` when the component needs interactivity, state, or browser-only APIs.
- Derive state from props/data where possible instead of duplicating it in `useState`.
- Keep side effects out of render; use `useEffect` only for synchronizing with external systems, not for computing derived values.
- Always provide stable, unique `key` props for list items (not array index unless the list is static).
- Memoize expensive computations and callbacks (`useMemo`/`useCallback`) only when profiling shows a real cost, not by default.
- Co-locate related state and avoid prop drilling more than a couple of levels; lift state up or use context only when genuinely shared.
- Handle loading and error states explicitly for any async data fetching.
- Type all props and component signatures explicitly with TypeScript; avoid `any`.

## Firestore

All Firestore access goes through `lib/firestore.ts`. Do not call the Firebase SDK directly.

```ts
import {
  getDocument, getCollection, setDocument, addDocument,
  updateDocument, deleteDocument, subscribeToDocument, subscribeToCollection,
  where, orderBy, limit,
} from "@/lib/firestore";
```

- `getDocument<T>(collection, id)` -- fetch one doc, returns `T & { id }` or null
- `getCollection<T>(collection, ...constraints)` -- fetch all docs with optional filters
- `setDocument<T>(collection, id, data, { merge? })` -- write or merge a doc (merge: true by default)
- `addDocument<T>(collection, data)` -- auto-ID add, returns the new document ID
- `updateDocument<T>(collection, id, data)` -- partial field update on an existing doc
- `deleteDocument(collection, id)` -- delete a doc
- `subscribeToDocument<T>(collection, id, callback)` -- real-time doc listener, returns unsubscribe
- `subscribeToCollection<T>(collection, callback, ...constraints)` -- real-time collection listener, returns unsubscribe

Query helpers (`where`, `orderBy`, `limit`, `startAfter`, etc.) are re-exported from the same module. All returned documents include an injected `id: string` field.
