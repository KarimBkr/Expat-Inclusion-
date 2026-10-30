"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { listAeshProfiles } from "@/services/admin-aesh";
import { listBookings } from "@/services/admin-bookings";
import { TAXONOMY_TYPES } from "@/types/admin";

type Counters = { toVerify: number; toPublish: number; awaitingAnswer: number };

const cardClass =
  "block bg-card border border-line rounded-2xl p-5 hover:border-primary/40 transition-colors";

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [counters, setCounters] = useState<Counters | null>(null);
  const [countersError, setCountersError] = useState(false);

  const loadCounters = useCallback(async () => {
    setCountersError(false);
    setCounters(null);
    try {
      const [pending, approved, requested] = await Promise.all([
        listAeshProfiles("pending"),
        listAeshProfiles("approved"),
        listBookings("requested"),
      ]);
      setCounters({
        toVerify: pending.length,
        toPublish: approved.length,
        awaitingAnswer: requested.length,
      });
    } catch {
      setCountersError(true);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  const isAdmin = user?.role === "admin";
  useEffect(() => {
    if (isAdmin) loadCounters();
  }, [isAdmin, loadCounters]);

  if (loading || !user) return <Spinner />;

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const tiles = counters && [
    {
      href: "/dashboard/admin/aesh",
      count: counters.toVerify,
      label: "Profils AESH à vérifier",
      hint: "Documents à consulter, puis approuver ou rejeter.",
    },
    {
      href: "/dashboard/admin/aesh",
      count: counters.toPublish,
      label: "Profils approuvés à publier",
      hint: "Ils seront visibles dans la recherche des familles.",
    },
    {
      href: "/dashboard/admin/bookings",
      count: counters.awaitingAnswer,
      label: "Demandes sans réponse",
      hint: "Demandes de familles en attente d'une réponse AESH.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Administration</h1>
          <p className="text-subtle mt-1">Ce qui demande votre attention aujourd&apos;hui.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-11 text-sm text-subtle hover:text-ink transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      <section aria-labelledby="todo-title" className="mb-10">
        <h2 id="todo-title" className="text-lg font-semibold text-ink mb-4">
          À traiter
        </h2>
        {countersError ? (
          <ErrorState message="Impossible de charger les compteurs." onRetry={loadCounters} />
        ) : !tiles ? (
          <Spinner label="Chargement des compteurs…" />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tiles.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className={`${cardClass} h-full`}>
                  <span
                    className={`block text-3xl font-bold ${t.count > 0 ? "text-primary" : "text-subtle"}`}
                  >
                    {t.count}
                  </span>
                  <span className="block font-semibold text-ink mt-1">{t.label}</span>
                  <span className="block text-xs text-subtle mt-1">{t.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="manage-title" className="mb-10">
        <h2 id="manage-title" className="text-lg font-semibold text-ink mb-4">
          Gérer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/admin/bookings" className={cardClass}>
            <span className="block font-semibold text-ink">Demandes de mise en relation</span>
            <span className="block text-xs text-subtle mt-1">Historique des statuts · notes</span>
          </Link>
          <Link href="/dashboard/admin/users" className={cardClass}>
            <span className="block font-semibold text-ink">Utilisateurs</span>
            <span className="block text-xs text-subtle mt-1">
              Parents, AESH, admins · suspendre
            </span>
          </Link>
          <Link href="/dashboard/admin/aesh-import" className={cardClass}>
            <span className="block font-semibold text-ink">Import CSV — profils AESH</span>
            <span className="block text-xs text-subtle mt-1">
              Créer des comptes en masse depuis le sourcing terrain
            </span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="taxo-title">
        <h2 id="taxo-title" className="text-lg font-semibold text-ink mb-4">
          Taxonomies métier
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TAXONOMY_TYPES.map((t) => (
            <Link key={t.type} href={`/dashboard/admin/taxonomies/${t.type}`} className={cardClass}>
              <span className="block font-semibold text-ink">{t.label}</span>
              <span className="block text-xs text-subtle mt-1">{t.singular}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
