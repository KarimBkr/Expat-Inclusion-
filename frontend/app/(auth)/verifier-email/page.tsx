"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { resendVerificationEmail } from "@/services/auth";

export default function VerifierEmailPage() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleResend() {
    setPending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-3">Vérifiez votre email</h1>
        <p className="text-subtle mb-2">
          Un email de vérification a été envoyé à{" "}
          <span className="font-medium text-ink">{user?.email ?? "votre adresse"}</span>.
        </p>
        <p className="text-subtle text-sm mb-8">
          Cliquez sur le lien dans l&apos;email pour activer votre compte.
        </p>

        {sent ? (
          <p className="text-sm text-primary font-medium">Email renvoyé !</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={pending}
            className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Renvoyer l'email de vérification"}
          </button>
        )}
      </div>
    </div>
  );
}
