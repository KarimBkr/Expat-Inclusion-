"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingHistory } from "@/components/booking/BookingHistory";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { BookingSummary, formatDate } from "@/components/booking/BookingSummary";
import { ReasonForm } from "@/components/booking/ReasonForm";
import { useAuth } from "@/lib/auth-context";
import { acceptBooking, cancelBooking, declineBooking, listBookings } from "@/services/booking";
import type { BookingRequest, BookingStatus } from "@/types/booking";

const FILTERS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "requested", label: "À traiter" },
  { value: "accepted", label: "Acceptées" },
  { value: "declined", label: "Refusées" },
  { value: "cancelled", label: "Annulées" },
];

type PendingAction = "decline" | "cancel" | null;

export default function DemandesRecuesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (status: BookingStatus | "") => {
    setLoading(true);
    setError("");
    try {
      setBookings(await listBookings(status || undefined));
    } catch {
      setError("Impossible de charger vos demandes. Réessayez.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (user.role !== "aesh") {
      router.replace("/dashboard");
      return;
    }
    load(filter);
  }, [user, authLoading, router, filter, load]);

  if (authLoading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/dashboard/aesh" className="text-sm text-subtle hover:text-ink transition-colors">
        ← Retour au tableau de bord
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Demandes reçues</h1>
      <p className="text-subtle text-sm mb-8">
        Acceptez ou refusez les demandes des familles. Un refus demande un motif, transmis au
        parent.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 text-sm rounded-xl border transition-colors ${
              filter === item.value
                ? "border-primary bg-primary-light text-primary font-medium"
                : "border-line text-subtle hover:border-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-cream border border-line rounded-2xl p-12 text-center">
          <p className="font-medium text-ink mb-1">Aucune demande pour l&apos;instant</p>
          <p className="text-sm text-subtle">
            Les familles vous contacteront dès que votre profil sera publié et visible dans la
            recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <AeshBookingCard key={booking.id} booking={booking} onChanged={() => load(filter)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AeshBookingCard({
  booking,
  onChanged,
}: {
  booking: BookingRequest;
  onChanged: () => void;
}) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setAccepting(true);
    setError("");
    try {
      await acceptBooking(booking.id);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAccepting(false);
    }
  }

  async function handleReason(reason: string) {
    setError("");
    try {
      if (pending === "decline") await declineBooking(booking.id, reason);
      else await cancelBooking(booking.id, reason);
      setPending(null);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const isPending = booking.status === "requested";
  const isAccepted = booking.status === "accepted";

  return (
    <div className="bg-card border border-line rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-ink">{booking.parent?.name ?? "Famille"}</h2>
          <p className="text-xs text-subtle mt-0.5">Reçue le {formatDate(booking.created_at)}</p>
        </div>
        <BookingStatusBadge status={booking.status} label={booking.status_label} />
      </div>

      <BookingSummary booking={booking} />

      {error && <p className="text-xs text-danger mt-3">{error}</p>}

      {pending ? (
        <ReasonForm
          label={
            pending === "decline"
              ? "Pourquoi refusez-vous cette demande ?"
              : "Pourquoi annulez-vous cet accompagnement ?"
          }
          submitLabel={pending === "decline" ? "Confirmer le refus" : "Confirmer l'annulation"}
          onSubmit={handleReason}
          onCancel={() => setPending(null)}
        />
      ) : (
        <div className="flex flex-wrap gap-3 mt-5">
          {isPending && (
            <>
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {accepting ? "Validation…" : "Accepter"}
              </button>
              <button
                type="button"
                onClick={() => setPending("decline")}
                className="px-4 py-2 border border-line text-sm font-medium text-danger rounded-xl hover:border-danger transition-colors"
              >
                Refuser
              </button>
            </>
          )}
          {isAccepted && (
            <button
              type="button"
              onClick={() => setPending("cancel")}
              className="px-4 py-2 border border-line text-sm font-medium text-danger rounded-xl hover:border-danger transition-colors"
            >
              Annuler l&apos;accompagnement
            </button>
          )}
        </div>
      )}

      <BookingHistory bookingId={booking.id} />
    </div>
  );
}
