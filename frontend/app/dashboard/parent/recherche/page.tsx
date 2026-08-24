"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { searchAesh } from "@/services/aesh-search";
import { getTaxonomies } from "@/services/parent-profile";
import type { AeshSearchResult, SearchFilters } from "@/types/aesh-search";
import type { Taxonomies } from "@/types/parent-profile";

const selectClass =
  "w-full px-3 py-2 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export default function RechercheAeshPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<AeshSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    getTaxonomies()
      .then(setTaxonomies)
      .catch(() => setError("Impossible de charger les filtres."));
  }, [user, authLoading, router]);

  const runSearch = useCallback(async (activeFilters: SearchFilters, activePage: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await searchAesh(activeFilters, activePage);
      setResults(res.data);
      setPage(res.meta.current_page);
      setLastPage(res.meta.last_page);
      setTotal(res.meta.total);
    } catch {
      setError("La recherche a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "parent") runSearch({}, 1);
  }, [user, runSearch]);

  function updateFilter(key: keyof SearchFilters, value: string) {
    const next = { ...filters };
    if (value) next[key] = Number(value);
    else delete next[key];
    setFilters(next);
    runSearch(next, 1);
  }

  function goToPage(target: number) {
    runSearch(filters, target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/dashboard/parent"
          className="text-sm text-subtle hover:text-ink transition-colors"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Trouver un AESH</h1>
        <p className="text-subtle text-sm">
          Filtrez selon le pays, le trouble accompagné, la modalité et le niveau scolaire.
        </p>
      </div>

      <div className="bg-card border border-line rounded-2xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilterSelect
          label="Pays"
          value={filters.country_id}
          onChange={(v) => updateFilter("country_id", v)}
          options={taxonomies?.countries ?? []}
        />
        <FilterSelect
          label="Trouble"
          value={filters.specialization_id}
          onChange={(v) => updateFilter("specialization_id", v)}
          options={taxonomies?.specializations ?? []}
        />
        <FilterSelect
          label="Modalité"
          value={filters.modality_id}
          onChange={(v) => updateFilter("modality_id", v)}
          options={taxonomies?.modalities ?? []}
        />
        <FilterSelect
          label="Niveau scolaire"
          value={filters.school_level_id}
          onChange={(v) => updateFilter("school_level_id", v)}
          options={taxonomies?.school_levels ?? []}
        />
      </div>

      {error && <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-cream border border-line rounded-2xl p-12 text-center">
          <p className="font-medium text-ink mb-1">Aucun AESH ne correspond à votre recherche</p>
          <p className="text-sm text-subtle">
            Élargissez vos critères ou revenez plus tard — de nouveaux profils sont publiés
            régulièrement.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-subtle mb-4">
            {total} accompagnant{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((aesh) => (
              <AeshCard key={aesh.id} aesh={aesh} />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-line disabled:opacity-40 hover:border-primary transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm text-subtle">
                Page {page} / {lastPage}
              </span>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= lastPage}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-line disabled:opacity-40 hover:border-primary transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: string) => void;
  options: { id: number; name: string }[];
}) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-subtle mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Tous</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function AeshCard({ aesh }: { aesh: AeshSearchResult }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-bold text-ink">{aesh.name}</h2>
          {aesh.experience_years !== null && (
            <p className="text-xs text-subtle mt-0.5">{aesh.experience_years} ans d'expérience</p>
          )}
        </div>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium">
          Candidature examinée
        </span>
      </div>

      <p className="text-sm text-subtle leading-relaxed mb-4 line-clamp-3">{aesh.bio}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {aesh.specializations.map((s) => (
          <span
            key={s.id}
            className="text-xs px-2 py-0.5 rounded-full bg-cream text-ink border border-line"
          >
            {s.name}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-end">
        <Link
          href={`/aesh/${aesh.id}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Voir le profil →
        </Link>
      </div>
    </div>
  );
}
