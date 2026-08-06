"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAeshDetail } from "@/services/aesh-detail";
import { createBooking } from "@/services/booking";
import { getTaxonomies } from "@/services/parent-profile";
import type { AeshDetail } from "@/types/aesh-detail";
import type { Taxonomies } from "@/types/parent-profile";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-line bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export default function NouvelleDemandePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NouvelleDemandeForm />
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="min-h-full flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function NouvelleDemandeForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const aeshId = Number(searchParams.get("aesh"));

  const [aesh, setAesh] = useState<AeshDetail | null>(null);
  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [message, setMessage] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [schoolLevelId, setSchoolLevelId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("4");

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
    if (!aeshId) {
      router.replace("/dashboard/parent/recherche");
      return;
    }

    Promise.all([getAeshDetail(aeshId), getTaxonomies()])
      .then(([detail, taxo]) => {
        setAesh(detail);
        setTaxonomies(taxo);
      })
      .catch(() => setError("Impossible de charger cet accompagnant."))
      .finally(() => setLoading(false));
  }, [aeshId, user, authLoading, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!aesh) return;

    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      await createBooking({
        aesh_profile_id: aesh.id,
        message,
        modality_id: Number(modalityId),
        school_level_id: Number(schoolLevelId),
        start_date: startDate,
        hours_per_week: Number(hoursPerWeek),
      });
      router.push("/dashboard/parent/reservations");
    } catch (err) {
      const typed = err as Error & { errors?: Record<string, string[]> };
      setFieldErrors(typed.errors ?? {});
      setError(typed.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!aesh) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-cream border border-line rounded-2xl p-12 text-center">
          <p className="font-medium text-ink mb-1">Accompagnant introuvable</p>
          <p className="text-sm text-subtle mb-6">{error || "Ce profil n'est plus disponible."}</p>
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href={`/aesh/${aesh.id}`}
        className="text-sm text-subtle hover:text-ink transition-colors"
      >
        ← Retour à la fiche
      </Link>

      <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Demander une réservation</h1>
      <p className="text-subtle text-sm mb-8">
        {aesh.name} recevra votre demande et pourra l&apos;accepter ou la refuser. Vous ne payez
        rien à cette étape.
      </p>

      <div className="bg-card border border-line rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{aesh.name}</p>
          <p className="text-xs text-subtle mt-0.5">Tarif appliqué à cette demande</p>
        </div>
        <p className="text-lg font-semibold text-ink">{aesh.hourly_rate} €/h</p>
      </div>

      {error && Object.keys(fieldErrors).length === 0 && (
        <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-line rounded-2xl p-6 space-y-5"
      >
        <Field label="Modalité souhaitée" error={fieldErrors.modality_id?.[0]}>
          <select
            id="modality"
            value={modalityId}
            onChange={(e) => setModalityId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Sélectionnez</option>
            {taxonomies?.modalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Niveau scolaire de l'enfant" error={fieldErrors.school_level_id?.[0]}>
          <select
            id="school-level"
            value={schoolLevelId}
            onChange={(e) => setSchoolLevelId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Sélectionnez</option>
            {taxonomies?.school_levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date de début souhaitée" error={fieldErrors.start_date?.[0]}>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className={inputClass}
              required
            />
          </Field>

          <Field label="Heures par semaine" error={fieldErrors.hours_per_week?.[0]}>
            <input
              id="hours"
              type="number"
              min={1}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="Votre besoin" error={fieldErrors.message?.[0]}>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Décrivez le contexte scolaire et le type d'accompagnement recherché. N'indiquez aucune information médicale."
            className={inputClass}
            required
          />
          <p className="text-xs text-subtle mt-1">
            {message.length}/1000 — 20 caractères minimum. Aucune donnée de santé ne doit être
            transmise ici.
          </p>
        </Field>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {submitting ? "Envoi en cours…" : "Envoyer la demande"}
          </button>
          <Link
            href={`/aesh/${aesh.id}`}
            className="inline-flex items-center justify-center px-5 py-2.5 border border-line text-sm font-medium rounded-xl hover:border-primary transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-xs font-medium text-subtle mb-1.5">{label}</span>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
