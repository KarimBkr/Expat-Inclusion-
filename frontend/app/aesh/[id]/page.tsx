"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAeshDetail } from "@/services/aesh-detail";
import type { AeshDetail } from "@/types/aesh-detail";
import type { TaxonomyRef } from "@/types/aesh-search";

export default function FicheAeshPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [aesh, setAesh] = useState<AeshDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

    getAeshDetail(id)
      .then(setAesh)
      .catch((err: Error & { status?: number }) => {
        if (err.status === 404) setNotFound(true);
        else setError("Impossible de charger cette fiche. Réessayez.");
      })
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <BackLink />
        <div className="bg-cream border border-line rounded-2xl p-12 text-center mt-6">
          <p className="font-medium text-ink mb-1">Ce profil n&apos;est plus disponible</p>
          <p className="text-sm text-subtle mb-6">
            L&apos;accompagnant a peut-être retiré sa fiche ou celle-ci n&apos;est pas encore
            publiée.
          </p>
          <Link
            href="/dashboard/parent/recherche"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  if (error || !aesh) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <BackLink />
        <div className="mt-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">
          {error || "Une erreur est survenue."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <BackLink />

      <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 mt-6">
        <h1 className="text-2xl font-bold text-ink">{aesh.name}</h1>
        <p className="text-sm text-subtle mt-1">
          {aesh.experience_years !== null && `${aesh.experience_years} ans d'expérience`}
          {aesh.experience_years !== null && aesh.timezone && " · "}
          {aesh.timezone && `Fuseau ${aesh.timezone}`}
        </p>

        <div className="flex flex-wrap gap-2 mt-5">
          <Badge label="Candidature examinée par notre équipe" />
          {aesh.published_at && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-cream text-subtle border border-line">
              Publié le {formatDate(aesh.published_at)}
            </span>
          )}
        </div>
      </div>

      <Section title="Présentation">
        <p className="text-sm text-subtle leading-relaxed whitespace-pre-line">{aesh.bio}</p>
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <TagSection title="Troubles accompagnés" items={aesh.specializations} />
        <TagSection title="Niveaux scolaires" items={aesh.school_levels} />
        <TagSection title="Langues" items={aesh.languages} />
        <TagSection title="Modalités" items={aesh.modalities} />
      </div>

      <div className="mt-4">
        <TagSection title="Pays d'intervention" items={aesh.countries} />
      </div>

      <div className="mt-8 p-6 bg-primary-900 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-semibold text-white">Cet accompagnant correspond à votre besoin ?</p>
          <p className="text-sm text-white/70 mt-1">
            Envoyez une demande de réservation. {aesh.name} pourra l&apos;accepter ou la refuser.
          </p>
        </div>
        <Link
          href={`/dashboard/parent/reservation/nouvelle?aesh=${aesh.id}`}
          className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-white text-primary text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          Demander une réservation
        </Link>
      </div>

      <p className="mt-4 text-xs text-subtle text-center">
        Les coordonnées de l&apos;accompagnant sont communiquées après acceptation de la demande.
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/parent/recherche"
      className="text-sm text-subtle hover:text-ink transition-colors"
    >
      ← Retour à la recherche
    </Link>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-primary-light text-primary font-medium">
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-6 mt-4">
      <h2 className="text-sm font-semibold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}

function TagSection({ title, items }: { title: string; items: TaxonomyRef[] }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-subtle">Non renseigné</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className="text-xs px-2 py-0.5 rounded-full bg-cream text-ink border border-line"
            >
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
