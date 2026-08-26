"use client";

import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  type DocumentData,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  type QueryDocumentSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { fetchFirebaseToken } from "@/services/messaging";
import type { ChatMessage, ConversationMeta } from "@/types/messaging";

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

let authReady: Promise<string> | null = null;

/**
 * Connecte l'utilisateur courant à Firebase Auth via le custom token Laravel.
 * Réutilise une promesse en cours pour éviter les doubles appels.
 */
export async function ensureFirebaseAuth(): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase n’est pas configuré. Ajoutez les clés NEXT_PUBLIC_FIREBASE_* dans .env.local."
    );
  }

  if (!authReady) {
    authReady = (async () => {
      const auth = getFirebaseAuth();
      const { token, uid } = await fetchFirebaseToken();

      if (auth.currentUser?.uid === uid) {
        return uid;
      }

      await signInWithCustomToken(auth, token);
      return uid;
    })().catch((err) => {
      authReady = null;
      throw err;
    });
  }

  return authReady;
}

export async function signOutFirebase(): Promise<void> {
  authReady = null;
  if (!isFirebaseConfigured()) return;
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    await signOut(auth);
  }
}

export function waitForFirebaseUser(): Promise<string | null> {
  if (!isFirebaseConfigured()) return Promise.resolve(null);
  const auth = getFirebaseAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser.uid);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user?.uid ?? null);
    });
  });
}

function mapMessage(snap: QueryDocumentSnapshot<DocumentData>): ChatMessage {
  const data = snap.data();
  const created = data.created_at;
  return {
    id: snap.id,
    sender_id: String(data.sender_id ?? ""),
    text: String(data.text ?? ""),
    created_at:
      created instanceof Timestamp ? created.toDate() : created?.toDate ? created.toDate() : null,
  };
}

export function subscribeToMessages(
  conversationId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void
): () => void {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("created_at", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      onMessages(snap.docs.map(mapMessage));
    },
    (err) => onError(err)
  );
}

export async function sendMessage(
  conversationId: string,
  text: string,
  senderId: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (trimmed.length > 2000) {
    throw new Error("Le message ne peut pas dépasser 2000 caractères.");
  }

  const db = getFirebaseDb();
  const messagesRef = collection(db, "conversations", conversationId, "messages");

  await addDoc(messagesRef, {
    sender_id: senderId,
    text: trimmed,
    created_at: serverTimestamp(),
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    last_message_at: serverTimestamp(),
    last_message_preview: trimmed.slice(0, 120),
    last_message_sender_id: senderId,
  });
}

/**
 * Écoute les métadonnées d'une conversation (dernier message) pour calculer le statut non-lu.
 */
export function subscribeToConversationMeta(
  conversationId: string,
  onMeta: (meta: ConversationMeta) => void,
  onError: (error: Error) => void
): () => void {
  const db = getFirebaseDb();
  return onSnapshot(
    doc(db, "conversations", conversationId),
    (snap) => {
      const data = snap.data();
      onMeta({
        lastMessageAt: toDate(data?.last_message_at),
        lastMessageSenderId: data?.last_message_sender_id ?? null,
      });
    },
    (err) => onError(err)
  );
}

/** Dernière lecture de la conversation par l'utilisateur courant (lecture ponctuelle). */
export async function getLastRead(conversationId: string, uid: string): Promise<Date | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "conversations", conversationId, "reads", uid));
  return toDate(snap.data()?.last_read_at);
}

/** Marque la conversation comme lue par l'utilisateur courant. */
export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(
    doc(db, "conversations", conversationId, "reads", uid),
    { last_read_at: serverTimestamp() },
    { merge: true }
  );
}
