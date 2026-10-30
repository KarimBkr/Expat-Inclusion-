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
import { cancelBooking, listBookings } from "@/services/booking";
import { createCheckoutSession } from "@/services/payment";
import type { BookingRequest, BookingStatus } from "@/types/booking";

const FILTERS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "requested", label: "En attente" },
  { value: "accepted", label: "Acceptées" },
  { value: "confirmed", label: "Confirmées" },
  { value: "declined", label: "Refusées" },
  { value: "cancelled", label: "Annulées" },
];

export default function MesReservationsPage() {
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
      setError("Impossible de charger vos demandes.");
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
    if (user.role !== "parent") {
      router.replace("/dashboard");
      return;
    }
    load(filter);
  }, [user, authLoading, router, filter, load]);

  if (authLoading || !user) {
    return <Spinner />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-ink mb-2">Mes demandes de réservation</h1>
      <p className="text-subtle text-sm mb-8">
        Suivez l&apos;état de vos demandes et annulez celles qui ne sont plus d&apos;actualité.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((item) => (
          <button
            key={item.value || "all"}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`min-h-11 px-3 py-1.5 text-sm rounded-xl border transition-colors ${
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
              Voir toutes mes demandes
            </button>
          }
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Aucune demande pour l'instant"
          hint="Trouvez un accompagnant et envoyez votre première demande de mise en relation."
          action={
            <Link
              href="/dashboard/parent/recherche"
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Rechercher un AESH
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <ParentBookingCard
              key={booking.id}
              booking={booking}
              onChanged={(message) => {
                setNotice(message ?? "");
                load(filter);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ParentBookingCard({
  booking,
  onChanged,
}: {
  booking: BookingRequest;
  onChanged: (notice?: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel(reason: string) {
    setError("");
    try {
      await cancelBooking(booking.id, reason);
      setCancelling(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const { checkoutUrl, paymentsEnabled } = await createCheckoutSession(booking.id);
      if (paymentsEnabled) {
        window.location.href = checkoutUrl;
        return;
      }
      setPaying(false);
      onChanged(
        "Mise en relation confirmée. Vous pouvez maintenant échanger avec l'accompagnant par messagerie."
      );
    } catch (err) {
      setError((err as Error).message);
      setPaying(false);
    }
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-ink">{booking.aesh?.name ?? "Accompagnant"}</h2>
          <p className="text-xs text-subtle mt-0.5">
            Demande envoyée le {formatDate(booking.created_at)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} label={booking.status_label} />
      </div>

      <BookingSummary booking={booking} />

      {error && <p className="text-xs text-danger mt-3">{error}</p>}

      {!booking.is_final &&
        (cancelling ? (
          <ReasonForm
            label="Pourquoi annulez-vous cette demande ?"
            submitLabel="Confirmer l'annulation"
            onSubmit={handleCancel}
            onCancel={() => setCancelling(false)}
          />
        ) : (
          <div className="flex flex-wrap gap-3 mt-5">
            {booking.aesh && (
              <Link
                href={`/aesh/${booking.aesh.id}`}
                className="px-4 py-2 border border-line text-sm font-medium rounded-xl hover:border-primary transition-colors"
              >
                Voir la fiche
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCancelling(true)}
              className="px-4 py-2 border border-line text-sm font-medium text-danger rounded-xl hover:border-danger transition-colors"
            >
              Annuler la demande
            </button>
          </div>
        ))}

      {booking.status === "accepted" && (
        <div className="mt-5">
          <p className="text-sm text-subtle mb-3">
            L&apos;accompagnant a accepté. Confirmez pour finaliser, puis convenez du tarif avec lui
            par messagerie.
          </p>
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="inline-flex px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {paying
              ? "Confirmation…"
              : booking.payments_enabled === false
                ? "Confirmer la mise en relation"
                : "Confirmer la réservation"}
          </button>
        </div>
      )}

      {booking.can_message && (
        <div className="mt-5">
          <Link
            href={`/dashboard/parent/conversations/${booking.id}`}
            className="inline-flex px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Ouvrir la conversation
          </Link>
        </div>
      )}

      <BookingHistory bookingId={booking.id} />
    </div>
  );
}
