"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { forgotPassword } from "@/services/auth";

export default function MotDePasseOubliePage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const fd = new FormData(e.currentTarget);

    try {
      await forgotPassword({ email: fd.get("email") as string });
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
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
          <h1 className="text-2xl font-bold text-ink mb-3">Email envoyé</h1>
          <p className="text-subtle mb-6">
            Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans
            quelques minutes.
          </p>
          <Link href="/connexion" className="text-primary font-medium hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Mot de passe oublié</h1>
          <p className="text-subtle">Nous vous enverrons un lien de réinitialisation</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-line p-8">
          {error && (
            <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="marie@exemple.com"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {pending ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-subtle">
            <Link href="/connexion" className="text-primary font-medium hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
