"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { resetPassword } from "@/services/auth";
import type { ApiError } from "@/types/auth";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError("");
    setPending(true);

    const fd = new FormData(e.currentTarget);

    try {
      await resetPassword({
        token,
        email,
        password: fd.get("password") as string,
        password_confirmation: fd.get("password_confirmation") as string,
      });
      router.push("/connexion?reset=1");
    } catch (err) {
      const apiErr = err as ApiError & { errors?: Record<string, string[]> };
      if (apiErr.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.errors)) {
          flat[key] = msgs[0];
        }
        setFieldErrors(flat);
      } else {
        setGlobalError(apiErr.message ?? "Lien expiré ou invalide. Recommencez.");
      }
    } finally {
      setPending(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="text-center py-16">
        <p className="text-subtle mb-4">Lien de réinitialisation invalide.</p>
        <Link href="/mot-de-passe-oublie" className="text-primary font-medium hover:underline">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-line p-8">
      {globalError && (
        <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{globalError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            placeholder="8 caractères minimum"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            placeholder="Répétez le mot de passe"
          />
          {fieldErrors.password_confirmation && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.password_confirmation}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {pending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Nouveau mot de passe</h1>
          <p className="text-subtle">Choisissez un mot de passe sécurisé</p>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
