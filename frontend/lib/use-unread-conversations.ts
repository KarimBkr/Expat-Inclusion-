"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  ensureConversationDoc,
  ensureFirebaseAuth,
  getLastRead,
  subscribeToConversationMeta,
} from "@/services/firestore-chat";
import type { ConversationSummary } from "@/types/messaging";

/**
 * Calcule le statut "non lu" par conversation à partir de Firestore
 * (dernier message vs dernière lecture de l'utilisateur courant).
 */
export function useUnreadConversations(conversations: ConversationSummary[]) {
  const [unread, setUnread] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isFirebaseConfigured() || conversations.length === 0) return;

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    (async () => {
      const uid = await ensureFirebaseAuth();
      if (cancelled) return;

      for (const item of conversations) {
        await ensureConversationDoc(item);
        const lastRead = await getLastRead(item.conversation_id, uid);
        if (cancelled) return;

        unsubs.push(
          subscribeToConversationMeta(
            item.conversation_id,
            (meta) => {
              const isUnread =
                meta.lastMessageAt !== null &&
                meta.lastMessageSenderId !== uid &&
                (!lastRead || meta.lastMessageAt > lastRead);
              setUnread((prev) => ({ ...prev, [item.conversation_id]: isUnread }));
            },
            () => {}
          )
        );
      }
    })().catch(() => {
      // Firebase indisponible : pas de badge, l'inbox reste fonctionnelle.
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => {
        unsub();
      });
    };
  }, [conversations]);

  const unreadCount = Object.values(unread).filter(Boolean).length;

  return { unread, unreadCount };
}
