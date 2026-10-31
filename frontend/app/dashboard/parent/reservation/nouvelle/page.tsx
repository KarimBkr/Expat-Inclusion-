"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { validateBookingForm } from "@/lib/booking-form";
import { getAeshDetail } from "@/services/aesh-detail";
import { createBooking } from "@/services/booking";
import { getParentProfile, getTaxonomies } from "@/services/parent-profile";
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
  return <Spinner />;
}

function NouvelleDemandeForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const aeshId = Number(searchParams.get("aesh"));

  const [aesh, setAesh] = useState<AeshDetail | null>(null);
  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<"" | "notfound" | "failed">("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [message, setMessage] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [schoolLevelId, setSchoolLevelId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("4");

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([getAeshDetail(aeshId), getTaxonomies(), getParentProfile().catch(() => null)])
      .then(([detail, taxo, parent]) => {
        setAesh(detail);
        setTaxonomies(taxo);
        // Prefill the child's level from the brief when the AESH covers it.
        const level = parent?.profile?.school_level_id;
        const levels = detail.school_levels.length ? detail.school_levels : taxo.school_levels;
        if (level && levels.some((l) => l.id === level)) setSchoolLevelId(String(level));
      })
      .catch((err: Error & { status?: number }) =>
        setLoadError(err.status === 404 ? "notfound" : "failed")
      )
      .finally(() => setLoading(false));
  }, [aeshId]);

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
    load();
  }, [aeshId, user, authLoading, router, load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!aesh) return;

    setError("");
    const clientErrors = validateBookingForm(
      { message, modalityId, schoolLevelId, startDate, hoursPerWeek },
      new Date().toISOString().slice(0, 10)
    );
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setError("Vérifiez les champs signalés.");
      return;
    }

    setSubmitting(true);

    try {
      await createBooking({
        aesh_profile_id: aesh.id,
        message,
        modality_id: Number(modalityId),
        school_level_id: Number(schoolLevelId),
        start_date: startDate,
        hours_per_week: Number(hoursPerWeek),
      });
      setSent(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const typed = err as Error & { errors?: Record<string, string[]> };
      setFieldErrors(typed.errors ?? {});
      setError(typed.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user || loading) {
    return <Spinner />;
  }

  if (loadError === "failed") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <ErrorState message="Impossible de charger cet accompagnant." onRetry={load} />
      </div>
    );
  }

  if (!aesh) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState
          title="Accompagnant introuvable"
          hint="Ce profil n'est plus disponible. Choisissez un autre accompagnant dans la recherche."
          action={
            <Link
              href="/dashboard/parent/recherche"
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Retour à la recherche
            </Link>
          }
        />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div role="status" className="bg-card border border-line rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3" aria-hidden="true">
            ✓
          </p>
          <h1 className="text-xl font-bold text-ink mb-2">Demande envoyée</h1>
          <p className="text-sm text-subtle mb-6">
            {`${aesh.name} a reçu votre demande. Vous recevrez une notification dès qu'une réponse
            sera donnée ; si elle est acceptée, vous pourrez confirmer la mise en relation et
            échanger par messagerie.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/parent/reservations"
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Suivre mes demandes
            </Link>
            <Link
              href="/dashboard/parent/recherche"
              className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 border border-line text-sm font-medium rounded-xl hover:border-primary transition-colors"
            >
              Voir d&apos;autres profils
            </Link>
          </div>
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

      <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Envoyer une demande</h1>
      <p className="text-subtle text-sm mb-8">
        {`${aesh.name} recevra votre demande et pourra l'accepter ou la refuser. La mise en relation
        est gratuite.`}
      </p>

      <div className="bg-card border border-line rounded-2xl p-5 mb-6">
        <p className="font-semibold text-ink">{aesh.name}</p>
        <p className="text-xs text-subtle mt-0.5">
          Les conditions de rémunération se conviennent directement avec l&apos;accompagnant, une
          fois la demande acceptée.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">
          {error}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit}
        className="bg-card border border-line rounded-2xl p-6 space-y-5"
      >
        <Field id="modality" label="Modalité souhaitée" error={fieldErrors.modality_id?.[0]}>
          <select
            id="modality"
            value={modalityId}
            onChange={(e) => setModalityId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Sélectionnez</option>
            {(aesh.modalities.length ? aesh.modalities : (taxonomies?.modalities ?? [])).map(
              (m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              )
            )}
          </select>
        </Field>

        <Field
          id="school-level"
          label="Niveau scolaire de l'enfant"
          error={fieldErrors.school_level_id?.[0]}
        >
          <select
            id="school-level"
            value={schoolLevelId}
            onChange={(e) => setSchoolLevelId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Sélectionnez</option>
            {(aesh.school_levels.length
              ? aesh.school_levels
              : (taxonomies?.school_levels ?? [])
            ).map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="start-date"
            label="Date de début souhaitée"
            error={fieldErrors.start_date?.[0]}
          >
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

          <Field id="hours" label="Heures par semaine" error={fieldErrors.hours_per_week?.[0]}>
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

        <Field id="message" label="Votre besoin" error={fieldErrors.message?.[0]}>
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
            className="inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
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
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-subtle mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
