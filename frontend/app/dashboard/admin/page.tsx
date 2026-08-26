"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { TAXONOMY_TYPES } from "@/types/admin";

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-ink">Administration</h1>
          <p className="text-subtle mt-1">Espace admin · Expat Inclusion</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-subtle hover:text-ink transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink mb-4">Taxonomies métier</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TAXONOMY_TYPES.map((t) => (
            <Link
              key={t.type}
              href={`/dashboard/admin/taxonomies/${t.type}`}
              className="bg-card border border-line rounded-2xl p-6 hover:border-primary/40 transition-colors"
            >
              <p className="font-semibold text-ink">{t.label}</p>
              <p className="text-xs text-subtle mt-1">CRUD · {t.singular}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-ink mb-4">Vérification AESH</h2>
        <Link
          href="/dashboard/admin/aesh"
          className="inline-flex items-center bg-card border border-line rounded-2xl px-6 py-4 hover:border-primary/40 transition-colors"
        >
          <div>
            <p className="font-semibold text-ink">Profils AESH à vérifier</p>
            <p className="text-xs text-subtle mt-1">
              Approuver · rejeter · publier · notes internes
            </p>
          </div>
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink mb-4">Sourcing</h2>
        <Link
          href="/dashboard/admin/aesh-import"
          className="inline-flex items-center bg-card border border-line rounded-2xl px-6 py-4 hover:border-primary/40 transition-colors"
        >
          <div>
            <p className="font-semibold text-ink">Import CSV — profils AESH</p>
            <p className="text-xs text-subtle mt-1">
              Créer des comptes en masse depuis le sourcing terrain
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
