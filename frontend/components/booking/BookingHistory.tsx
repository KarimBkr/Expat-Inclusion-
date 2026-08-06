"use client";

import { useState } from "react";
import { getBooking } from "@/services/booking";
import type { BookingStatusHistory } from "@/types/booking";

/** Historique des changements de statut d'une demande (US-12). */
export function BookingHistory({ bookingId }: { bookingId: number }) {
  const [histories, setHistories] = useState<BookingStatusHistory[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (histories) return;

    setLoading(true);
    setError("");
    try {
      const booking = await getBooking(bookingId);
      setHistories(booking.histories ?? []);
    } catch {
      setError("Historique indisponible pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 pt-4 border-t border-line">
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-medium text-subtle hover:text-ink transition-colors"
      >
        {open ? "Masquer l'historique" : "Voir l'historique"}
      </button>

      {open && (
        <div className="mt-3">
          {loading && <p className="text-xs text-subtle">Chargement…</p>}
          {error && <p className="text-xs text-danger">{error}</p>}
          {histories?.length === 0 && <p className="text-xs text-subtle">Aucun mouvement.</p>}
          {histories && histories.length > 0 && (
            <ol className="space-y-2">
              {histories.map((entry) => (
                <li key={entry.id} className="text-xs text-subtle flex flex-wrap gap-x-2">
                  <span className="font-medium text-ink">{entry.label}</span>
                  {entry.author && <span>par {entry.author.name}</span>}
                  <span>· {formatDateTime(entry.created_at)}</span>
                  {entry.reason && <span className="w-full italic">« {entry.reason} »</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
