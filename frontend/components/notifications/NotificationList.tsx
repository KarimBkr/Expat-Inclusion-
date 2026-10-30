"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { listNotifications, markNotificationRead } from "@/services/notifications";
import type { AppNotification } from "@/types/notification";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function NotificationList() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt relance le chargement après « Réessayer »
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { items } = await listNotifications();
        if (!cancelled) setItems(items);
      } catch {
        if (!cancelled) setError("Impossible de charger vos notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  async function handleOpen(notification: AppNotification) {
    if (!notification.read_at) {
      setItems((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      markNotificationRead(notification.id).catch(() => {});
    }
    router.push(notification.data.url);
  }

  if (loading) {
    return <Spinner label="Chargement de vos notifications…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune notification"
        hint="Vous serez prévenu ici de toute nouvelle demande ou réponse."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((notification) => (
        <li key={notification.id}>
          <button
            type="button"
            onClick={() => handleOpen(notification)}
            className={`w-full text-left flex items-start justify-between gap-3 bg-card border rounded-2xl p-5 hover:border-primary transition-colors ${
              notification.read_at ? "border-line" : "border-primary/40"
            }`}
          >
            <div>
              <p className="text-sm text-ink flex items-center gap-2">
                {!notification.read_at && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
                {notification.data.message}
              </p>
              <p className="text-xs text-subtle mt-1">{formatDate(notification.created_at)}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
