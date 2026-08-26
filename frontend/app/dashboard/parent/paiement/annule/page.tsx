"use client";

import Link from "next/link";

export default function PaiementAnnulePage() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-cream border border-line rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-3">Paiement annulé</h1>
        <p className="text-subtle text-sm mb-8">
          Vous n&apos;avez rien payé. Votre demande reste acceptée — vous pouvez relancer le
          paiement à tout moment depuis vos demandes.
        </p>

        <Link
          href="/dashboard/parent/reservations"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Retour à mes demandes
        </Link>
      </div>
    </div>
  );
}
