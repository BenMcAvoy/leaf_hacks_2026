import {
  getFirestore as _getFirestore,
  collection,
  doc,
  getDoc as _getDoc,
  getDocs as _getDocs,
  setDoc as _setDoc,
  addDoc as _addDoc,
  updateDoc as _updateDoc,
  deleteDoc as _deleteDoc,
  onSnapshot as _onSnapshot,
  query,
  serverTimestamp,
  type Firestore,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
  type WithFieldValue,
  type PartialWithFieldValue,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";

export {
  where,
  orderBy,
  limit,
  limitToLast,
  startAfter,
  startAt,
  endAt,
  endBefore,
  serverTimestamp,
  Timestamp,
  FieldValue,
} from "firebase/firestore";

let db: Firestore | null = null;

function getDb(): Firestore {
  if (!db) db = _getFirestore(firebaseApp);
  return db;
}

/** Fetch a single document by collection path and document ID. Returns null if not found. */
export async function getDocument<T extends DocumentData>(
  collectionPath: string,
  id: string,
): Promise<(T & { id: string }) | null> {
  const snap = await _getDoc(doc(getDb(), collectionPath, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

/** Fetch all documents in a collection, with optional query constraints. */
export async function getCollection<T extends DocumentData>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> {
  const ref = collection(getDb(), collectionPath);
  const q = constraints.length ? query(ref, ...constraints) : ref;
  const snap = await _getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

/** Write a document at a specific ID, merging by default. Pass merge: false to overwrite. */
export async function setDocument<T extends DocumentData>(
  collectionPath: string,
  id: string,
  data: WithFieldValue<T>,
  { merge = true }: { merge?: boolean } = {},
): Promise<void> {
  await _setDoc(doc(getDb(), collectionPath, id), data, { merge });
}

/** Add a new document with an auto-generated ID. Returns the new document ID. */
export async function addDocument<T extends DocumentData>(
  collectionPath: string,
  data: WithFieldValue<T>,
): Promise<string> {
  const ref = await _addDoc(collection(getDb(), collectionPath), data);
  return ref.id;
}

/** Partially update fields on an existing document. */
export async function updateDocument<T extends DocumentData>(
  collectionPath: string,
  id: string,
  data: PartialWithFieldValue<T>,
): Promise<void> {
  await _updateDoc(
    doc(getDb(), collectionPath, id),
    data as Record<string, unknown>,
  );
}

/** Delete a document by collection path and ID. */
export async function deleteDocument(
  collectionPath: string,
  id: string,
): Promise<void> {
  await _deleteDoc(doc(getDb(), collectionPath, id));
}

/** Subscribe to real-time updates on a single document. Returns an unsubscribe function. */
export function subscribeToDocument<T extends DocumentData>(
  collectionPath: string,
  id: string,
  callback: (data: (T & { id: string }) | null) => void,
): Unsubscribe {
  return _onSnapshot(doc(getDb(), collectionPath, id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null);
  });
}

/** Subscribe to real-time updates on a collection, with optional query constraints. Returns an unsubscribe function. */
export function subscribeToCollection<T extends DocumentData>(
  collectionPath: string,
  callback: (data: (T & { id: string })[]) => void,
  ...constraints: QueryConstraint[]
): Unsubscribe {
  const ref = collection(getDb(), collectionPath);
  const q = constraints.length ? query(ref, ...constraints) : ref;
  return _onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
  });
}

/** Returns a server timestamp value for use in document writes. */
export const timestamp = serverTimestamp;
