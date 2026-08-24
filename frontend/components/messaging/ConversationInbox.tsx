"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUnreadConversations } from "@/lib/use-unread-conversations";
import { listConversations } from "@/services/messaging";
import type { ConversationSummary } from "@/types/messaging";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ConversationInbox({
  basePath,
  emptyHint,
}: {
  basePath: string;
  emptyHint: string;
}) {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { unread } = useUnreadConversations(items);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listConversations();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setError("Impossible de charger vos conversations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-cream border border-line rounded-2xl p-12 text-center">
        <p className="font-medium text-ink mb-1">Aucune conversation ouverte</p>
        <p className="text-sm text-subtle">{emptyHint}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.conversation_id}>
          <Link
            href={`${basePath}/${item.booking_id}`}
            className="block bg-card border border-line rounded-2xl p-5 hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink flex items-center gap-2">
                  {item.peer?.name ?? "Interlocuteur"}
                  {unread[item.conversation_id] && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Nouveau
                    </span>
                  )}
                </p>
                <p className="text-xs text-subtle mt-1">
                  Demande #{item.booking_id}
                  {item.created_at ? ` · depuis le ${formatDate(item.created_at)}` : ""}
                </p>
              </div>
              <span className="text-xs font-medium text-primary shrink-0">Ouvrir →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
