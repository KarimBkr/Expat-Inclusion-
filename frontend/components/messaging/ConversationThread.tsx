"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  ensureFirebaseAuth,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
} from "@/services/firestore-chat";
import { getConversation } from "@/services/messaging";
import type { ChatMessage, ConversationSummary } from "@/types/messaging";

function formatTime(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ConversationThread({ bookingId }: { bookingId: number }) {
  const [meta, setMeta] = useState<ConversationSummary | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // Le back garantit que le document Firestore existe déjà avant de
        // répondre : aucune création côté client, les rules l'interdisent.
        const conversation = await getConversation(bookingId);
        if (cancelled) return;
        setMeta(conversation);

        const firebaseUid = await ensureFirebaseAuth();
        if (cancelled) return;
        setUid(firebaseUid);

        unsub = subscribeToMessages(
          conversation.conversation_id,
          (next) => {
            if (!cancelled) {
              setMessages(next);
              markConversationRead(conversation.conversation_id, firebaseUid).catch(() => {});
              // Scroll après paint du prochain rendu
              requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              });
            }
          },
          (err) => {
            if (!cancelled) setError(err.message || "Erreur de synchronisation des messages.");
          }
        );
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Impossible d’ouvrir la conversation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [bookingId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!meta || !uid || !text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(meta.conversation_id, text, uid);
      setText("");
    } catch (err) {
      setError((err as Error).message || "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">
        {error || "Conversation introuvable."}
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-card border border-line rounded-2xl overflow-hidden min-h-[28rem]">
      <div className="px-5 py-4 border-b border-line">
        <p className="font-semibold text-ink">{meta.peer?.name ?? "Conversation"}</p>
        <p className="text-xs text-subtle mt-0.5">Demande #{meta.booking_id} · acceptée</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[28rem]">
        {messages.length === 0 ? (
          <p className="text-sm text-subtle text-center py-8">
            Aucun message pour l&apos;instant. Envoyez le premier.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.sender_id === uid;
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    mine
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-cream text-ink border border-line rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-subtle"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 p-2 bg-danger/10 text-danger text-xs rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-line p-3 flex gap-2">
        <label htmlFor="chat-message" className="sr-only">
          Votre message
        </label>
        <input
          id="chat-message"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Écrire un message…"
          className="flex-1 rounded-xl border border-line bg-cream px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {sending ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
