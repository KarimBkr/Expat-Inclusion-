"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink mb-3">Une erreur est survenue</h1>
      <p className="text-subtle text-sm mb-8">
        Quelque chose s&apos;est mal passé de notre côté. Réessayez, ou contactez-nous si le
        problème persiste.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Réessayer
        </button>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-2.5 border border-line text-sm font-semibold rounded-xl hover:border-primary transition-colors"
        >
          Nous contacter
        </Link>
      </div>
    </div>
  );
}
