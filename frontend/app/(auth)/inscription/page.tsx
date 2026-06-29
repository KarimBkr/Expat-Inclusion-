"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { register } from "@/services/auth";
import type { ApiError } from "@/types/auth";

export default function InscriptionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"parent" | "aesh">("parent");
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError("");
    setPending(true);

    const fd = new FormData(e.currentTarget);

    try {
      await register({
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        password_confirmation: fd.get("password_confirmation") as string,
        role,
      });
      router.push("/verifier-email");
    } catch (err) {
      const apiErr = err as ApiError & { errors?: Record<string, string[]> };
      if (apiErr.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(apiErr.errors)) {
          flat[key] = msgs[0];
        }
        setFieldErrors(flat);
      } else {
        setGlobalError(apiErr.message ?? "Une erreur est survenue.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Créer un compte</h1>
          <p className="text-subtle">Rejoignez Expat Inclusion</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-line p-8">
          {globalError && (
            <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">
              {globalError}
            </div>
          )}

          {/* Sélection du rôle */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("parent")}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                role === "parent"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-line text-subtle hover:border-primary/50"
              }`}
            >
              <div className="font-semibold mb-1">Je suis parent</div>
              <div className="text-xs">Je recherche un AESH pour mon enfant</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("aesh")}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                role === "aesh"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-line text-subtle hover:border-primary/50"
              }`}
            >
              <div className="font-semibold mb-1">Je suis AESH</div>
              <div className="text-xs">Je propose mes services d&apos;accompagnement</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                placeholder="Marie Dupont"
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-danger">{fieldErrors.name}</p>}
            </div>

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
              {fieldErrors.email && <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Mot de passe
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
              {pending ? "Création du compte…" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-subtle">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
