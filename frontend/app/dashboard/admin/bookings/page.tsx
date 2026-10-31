"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { addBookingNote, getBooking, listBookings } from "@/services/admin-bookings";
import type { AdminBooking, BookingStatus } from "@/types/admin";
import { BOOKING_STATUS_LABELS } from "@/types/admin";

const FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "requested", label: "Demandées" },
  { value: "accepted", label: "Acceptées" },
  { value: "confirmed", label: "Confirmées" },
  { value: "declined", label: "Refusées" },
  { value: "cancelled", label: "Annulées" },
];

export default function AdminBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await listBookings(filter === "all" ? undefined : filter);
      setBookings(data);
    } catch {
      setListError("Impossible de charger les demandes.");
    } finally {
      setListLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") loadList();
  }, [user, loadList]);

  async function openBooking(id: number) {
    setError("");
    try {
      setSelected(await getBooking(id));
      setNoteBody("");
    } catch {
      setError("Impossible de charger la demande.");
    }
  }

  async function runAction(action: () => Promise<void>) {
    if (!selected) return;
    setActionPending(true);
    setError("");
    try {
      await action();
      setSelected(await getBooking(selected.id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionPending(false);
    }
  }

  if (loading || !user) {
    return <Spinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-sm text-subtle hover:text-ink">
          ← Administration
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-3">Demandes de réservation</h1>
        <p className="text-sm text-subtle mt-1">
          Visibilité transverse pour le support — les décisions (accepter, refuser, annuler) restent
          au parent et à l&apos;AESH.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              filter === f.value
                ? "bg-primary text-white border-primary"
                : "bg-card border-line text-subtle hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          aria-label="Liste des demandes"
          className="bg-card border border-line rounded-2xl overflow-hidden"
        >
          {listLoading ? (
            <Spinner label="Chargement des demandes…" />
          ) : listError ? (
            <ErrorState message={listError} onRetry={loadList} />
          ) : bookings.length === 0 ? (
            <EmptyState
              title="Aucune demande pour ce filtre"
              hint="Les demandes envoyées par les parents apparaîtront ici."
            />
          ) : (
            <ul>
              {bookings.map((b) => (
                <li key={b.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => openBooking(b.id)}
                    className={`w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors ${
                      selected?.id === b.id ? "bg-primary-light/50" : ""
                    }`}
                  >
                    <p className="font-medium text-ink">
                      {b.parent?.name ?? "Parent"} → {b.aesh?.name ?? "AESH"}
                    </p>
                    <p className="text-xs text-subtle mt-0.5">
                      {b.start_date} · {b.hours_per_week}h/semaine
                    </p>
                    <span className="inline-flex flex-wrap gap-1.5 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cream text-subtle">
                        {BOOKING_STATUS_LABELS[b.status]}
                      </span>
                      {b.payments_enabled !== false &&
                        b.payments?.some((p) => p.status === "paid") && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">
                            Payé
                          </span>
                        )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label="Détail de la demande"
          className="bg-card border border-line rounded-2xl p-6"
        >
          {!selected ? (
            <p className="text-sm text-subtle text-center py-12">
              Sélectionnez une demande pour voir le détail.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-ink text-lg">
                  {selected.parent?.name} → {selected.aesh?.name}
                </h2>
                <p className="text-sm text-subtle">
                  {selected.parent?.email} · {selected.aesh?.email}
                </p>
                <p className="mt-3 text-sm">
                  Statut : <strong>{BOOKING_STATUS_LABELS[selected.status]}</strong>
                </p>
                {selected.modality && (
                  <p className="text-sm text-subtle">
                    {selected.modality.name} · {selected.school_level?.name} ·{" "}
                    {selected.hours_per_week}h/semaine
                  </p>
                )}
                <p className="mt-3 text-sm text-ink bg-cream rounded-xl p-4">{selected.message}</p>
                {selected.response_reason && (
                  <p className="mt-3 text-sm text-subtle">Motif : {selected.response_reason}</p>
                )}
              </div>

              {selected.payments_enabled !== false &&
                selected.payments &&
                selected.payments.length > 0 && (
                  <div className="border-t border-line pt-4">
                    <h3 className="text-sm font-semibold text-ink mb-3">Paiement</h3>
                    <ul className="space-y-2">
                      {selected.payments.map((p) => (
                        <li key={p.id} className="text-sm bg-cream rounded-xl p-3">
                          {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()} ·{" "}
                          <span
                            className={
                              p.status === "paid"
                                ? "text-primary font-medium"
                                : p.status === "failed"
                                  ? "text-danger"
                                  : "text-subtle"
                            }
                          >
                            {p.status}
                          </span>
                          {p.paid_at && (
                            <span className="text-xs text-subtle">
                              {" "}
                              · {new Date(p.paid_at).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {selected.histories && selected.histories.length > 0 && (
                <div className="border-t border-line pt-4">
                  <h3 className="text-sm font-semibold text-ink mb-3">Historique des statuts</h3>
                  <ul className="space-y-1">
                    {selected.histories.map((h) => (
                      <li key={h.id} className="text-xs text-subtle">
                        {h.label} par {h.author?.name ?? "?"}
                        {h.reason ? ` — ${h.reason}` : ""} ·{" "}
                        {h.created_at && new Date(h.created_at).toLocaleDateString("fr-FR")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink mb-3">Notes internes</h3>
                {selected.admin_notes && selected.admin_notes.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {selected.admin_notes.map((note) => (
                      <li key={note.id} className="text-sm bg-cream rounded-xl p-3">
                        <p>{note.body}</p>
                        <p className="text-xs text-subtle mt-1">
                          {note.admin?.name} ·{" "}
                          {new Date(note.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-subtle mb-4">Aucune note pour cette demande.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Note interne"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Ajouter une note interne…"
                    className="flex-1 px-3 py-2 text-sm border border-line rounded-xl"
                  />
                  <button
                    type="button"
                    disabled={actionPending || !noteBody.trim()}
                    onClick={() =>
                      runAction(async () => {
                        await addBookingNote(selected.id, noteBody.trim());
                        setNoteBody("");
                      })
                    }
                    className="px-4 py-2 border border-line text-sm font-medium rounded-xl hover:bg-cream disabled:opacity-60"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
