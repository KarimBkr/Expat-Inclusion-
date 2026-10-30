"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingHistory } from "@/components/booking/BookingHistory";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { BookingSummary, formatDate } from "@/components/booking/BookingSummary";
import { ReasonForm } from "@/components/booking/ReasonForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
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

type PendingAction = "accept" | "decline" | "cancel" | null;

const NOTICES: Record<Exclude<PendingAction, null>, string> = {
  accept: "Demande acceptée. La famille est prévenue et la conversation est ouverte.",
  decline: "Demande refusée. La famille a reçu votre motif.",
  cancel: "Accompagnement annulé. La famille a reçu votre motif.",
};

export default function DemandesRecuesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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

  if (authLoading || !user) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-ink mb-2">Demandes reçues</h1>
      <p className="text-subtle text-sm mb-8">
        Acceptez ou refusez les demandes des familles. Un refus demande un motif, transmis au
        parent.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            onClick={() => {
              setNotice("");
              setFilter(item.value);
            }}
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

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-primary-light px-4 py-3 text-sm font-medium text-primary"
        >
          {notice}
        </p>
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => load(filter)} />
      ) : loading ? (
        <Spinner label="Chargement de vos demandes…" />
      ) : bookings.length === 0 && filter ? (
        <EmptyState
          title="Aucune demande dans cette catégorie"
          hint="Affichez toutes vos demandes pour voir les autres statuts."
          action={
            <button
              type="button"
              onClick={() => setFilter("")}
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 border border-line text-sm font-medium rounded-xl hover:border-primary transition-colors"
            >
              Voir toutes les demandes
            </button>
          }
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Aucune demande pour l'instant"
          hint="Les familles vous contacteront dès que votre profil sera vérifié et visible dans la recherche. Un profil complet les aide à vous choisir."
          action={
            <Link
              href="/dashboard/aesh/profil"
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Compléter mon profil
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <AeshBookingCard
              key={booking.id}
              booking={booking}
              onChanged={(message) => {
                setNotice(message);
                load(filter);
              }}
            />
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
  onChanged: (notice: string) => void;
}) {
  const [pending, setPending] = useState<PendingAction>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setAccepting(true);
    setError("");
    try {
      await acceptBooking(booking.id);
      setPending(null);
      onChanged(NOTICES.accept);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAccepting(false);
    }
  }

  async function handleReason(reason: string) {
    if (pending !== "decline" && pending !== "cancel") return;
    setError("");
    try {
      if (pending === "decline") await declineBooking(booking.id, reason);
      else await cancelBooking(booking.id, reason);
      onChanged(NOTICES[pending]);
      setPending(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const isPending = booking.status === "requested";
  const isAccepted = booking.status === "accepted";

  return (
    <article
      aria-labelledby={`booking-${booking.id}`}
      className="bg-card border border-line rounded-2xl p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 id={`booking-${booking.id}`} className="font-bold text-ink">
            {booking.parent?.name ?? "Famille"}
          </h2>
          <p className="text-xs text-subtle mt-0.5">Reçue le {formatDate(booking.created_at)}</p>
        </div>
        <BookingStatusBadge status={booking.status} label={booking.status_label} />
      </div>

      <BookingSummary booking={booking} />

      {error && (
        <p role="alert" className="text-sm text-danger mt-3">
          {error}
        </p>
      )}

      {pending === "accept" ? (
        <div className="mt-4 p-4 bg-cream border border-line rounded-xl">
          <p className="text-sm text-ink">
            Accepter cette demande ? La famille sera prévenue et pourra échanger avec vous dans la
            messagerie.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="min-h-11 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {accepting ? "Validation…" : "Confirmer l'acceptation"}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="min-h-11 px-4 py-2 border border-line text-sm font-medium rounded-xl hover:border-primary transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      ) : pending ? (
        <ReasonForm
          label={
            pending === "decline"
              ? "Pourquoi refusez-vous cette demande ? (transmis à la famille)"
              : "Pourquoi annulez-vous cet accompagnement ? (transmis à la famille)"
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
                onClick={() => setPending("accept")}
                className="min-h-11 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => setPending("decline")}
                className="min-h-11 px-4 py-2 border border-line text-sm font-medium text-danger rounded-xl hover:border-danger transition-colors"
              >
                Refuser
              </button>
            </>
          )}
          {isAccepted && (
            <>
              {booking.can_message && (
                <Link
                  href={`/dashboard/aesh/conversations/${booking.id}`}
                  className="inline-flex items-center min-h-11 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Ouvrir la conversation
                </Link>
              )}
              <button
                type="button"
                onClick={() => setPending("cancel")}
                className="min-h-11 px-4 py-2 border border-line text-sm font-medium text-danger rounded-xl hover:border-danger transition-colors"
              >
                Annuler l&apos;accompagnement
              </button>
            </>
          )}
        </div>
      )}

      <BookingHistory bookingId={booking.id} />
    </article>
  );
}
