"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getBooking } from "@/services/booking";
import type { BookingRequest } from "@/types/booking";

/**
 * Stripe redirige ici dès que le client termine le paiement — avant même que
 * le webhook (US-15) ait forcément confirmé la demande côté serveur. On ne
 * suppose donc jamais le succès : on relit le statut réel, avec une seule
 * tentative de re-vérification après un court délai si besoin.
 */
export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaiementSuccesContent />
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="min-h-full flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PaiementSuccesContent() {
  const searchParams = useSearchParams();
  const bookingId = Number(searchParams.get("booking"));

  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function check(retryOnce: boolean) {
      try {
        const result = await getBooking(bookingId);
        if (cancelled) return;
        setBooking(result);

        if (result.status !== "confirmed" && retryOnce) {
          setTimeout(() => check(false), 3000);
          return;
        }
      } catch {
        if (!cancelled) setError("Impossible de vérifier le statut de la demande.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check(true);

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (checking) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-subtle">Vérification du paiement…</p>
        </div>
      </div>
    );
  }

  const confirmed = booking?.status === "confirmed";

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            confirmed ? "bg-primary-light" : "bg-amber-50"
          }`}
        >
          <svg
            aria-hidden="true"
            className={`w-8 h-8 ${confirmed ? "text-primary" : "text-amber-600"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {confirmed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-3">
          {confirmed ? "Réservation confirmée" : "Confirmation en cours"}
        </h1>
        <p className="text-subtle text-sm mb-8">
          {error ||
            (confirmed
              ? "Votre réservation est confirmée. L'accompagnant en est informé."
              : "La confirmation finale peut prendre quelques instants — actualisez cette page si le statut ne change pas.")}
        </p>

        <Link
          href="/dashboard/parent/reservations"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Voir mes demandes
        </Link>
      </div>
    </div>
  );
}
