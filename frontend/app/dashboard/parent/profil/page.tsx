"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import {
  getParentProfile,
  getTaxonomies,
  saveParentProfile,
} from "@/services/parent-profile";
import type { ApiError } from "@/types/auth";
import type { ParentProfile, Taxonomies } from "@/types/parent-profile";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export default function ParentProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [existingProfile, setExistingProfile] = useState<ParentProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const [countryId, setCountryId] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [phone, setPhone] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [schoolLevelId, setSchoolLevelId] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [childBrief, setChildBrief] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [tax, profileRes] = await Promise.all([getTaxonomies(), getParentProfile()]);
      setTaxonomies(tax);

      if (profileRes.profile) {
        const p = profileRes.profile;
        setExistingProfile(p);
        setCountryId(String(p.country_id));
        setTimezone(p.timezone);
        setPhone(p.phone ?? "");
        setChildFirstName(p.child_first_name);
        setSchoolLevelId(String(p.school_level_id));
        setSpecializationId(String(p.specialization_id));
        setChildBrief(p.child_brief ?? "");
        setConsentTerms(p.consent_terms);
        setConsentData(p.consent_data_processing);
        setConsentMarketing(p.consent_marketing);
      }
    } catch {
      setGlobalError("Impossible de charger le profil. Réessayez plus tard.");
    } finally {
      setPageLoading(false);
    }
  }, []);

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
    loadData();
  }, [user, authLoading, router, loadData]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError("");
    setSuccess("");
    setPending(true);

    try {
      const result = await saveParentProfile(
        {
          country_id: Number(countryId),
          timezone,
          phone: phone.trim() || null,
          child_first_name: childFirstName.trim(),
          school_level_id: Number(schoolLevelId),
          specialization_id: Number(specializationId),
          child_brief: childBrief.trim() || null,
          consent_terms: consentTerms,
          consent_data_processing: consentData,
          consent_marketing: consentMarketing,
        },
        existingProfile !== null
      );

      setExistingProfile(result.profile);
      setSuccess(result.message);
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

  if (authLoading || pageLoading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/dashboard/parent"
          className="text-sm text-subtle hover:text-ink transition-colors"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Mon profil parent</h1>
        <p className="text-subtle text-sm">
          Ces informations nous permettent de vous mettre en relation avec un AESH adapté. Nous
          collectons uniquement le minimum nécessaire — aucun document médical n&apos;est demandé.
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-line p-8">
        {globalError && (
          <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{globalError}</div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-primary-light text-primary text-sm rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-ink">Informations personnelles</h2>

            <div>
              <label htmlFor="country_id" className="block text-sm font-medium text-ink mb-1.5">
                Pays de résidence
              </label>
              <select
                id="country_id"
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Sélectionnez un pays</option>
                {taxonomies?.countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.country_id && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.country_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-ink mb-1.5">
                Fuseau horaire
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                className={inputClass}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {fieldErrors.timezone && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.timezone}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1.5">
                Téléphone <span className="text-subtle font-normal">(optionnel)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+33 6 12 34 56 78"
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.phone}</p>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-ink">Brief enfant</h2>
              <p className="text-xs text-subtle mt-1">
                Prénom et besoin principal uniquement — pas de diagnostic ni de document médical.
              </p>
            </div>

            <div>
              <label
                htmlFor="child_first_name"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Prénom de l&apos;enfant
              </label>
              <input
                id="child_first_name"
                type="text"
                value={childFirstName}
                onChange={(e) => setChildFirstName(e.target.value)}
                required
                maxLength={50}
                className={inputClass}
                placeholder="Prénom"
              />
              {fieldErrors.child_first_name && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.child_first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="school_level_id" className="block text-sm font-medium text-ink mb-1.5">
                Niveau scolaire
              </label>
              <select
                id="school_level_id"
                value={schoolLevelId}
                onChange={(e) => setSchoolLevelId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Sélectionnez un niveau</option>
                {taxonomies?.school_levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.cycle}
                  </option>
                ))}
              </select>
              {fieldErrors.school_level_id && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.school_level_id}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="specialization_id"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Type de besoin
              </label>
              <select
                id="specialization_id"
                value={specializationId}
                onChange={(e) => setSpecializationId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Sélectionnez un type</option>
                {taxonomies?.specializations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {fieldErrors.specialization_id && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.specialization_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="child_brief" className="block text-sm font-medium text-ink mb-1.5">
                Contexte bref{" "}
                <span className="text-subtle font-normal">(optionnel, 500 car. max)</span>
              </label>
              <textarea
                id="child_brief"
                value={childBrief}
                onChange={(e) => setChildBrief(e.target.value)}
                maxLength={500}
                rows={4}
                className={inputClass}
                placeholder="Ex. : besoin d'aide en organisation, difficultés en lecture…"
              />
              <p className="mt-1 text-xs text-subtle text-right">{childBrief.length}/500</p>
              {fieldErrors.child_brief && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.child_brief}</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink">Consentements</h2>

            <div className="p-4 bg-cream rounded-xl border border-line text-xs text-subtle">
              Conformément au RGPD, nous limitons la collecte aux données strictement nécessaires à
              la mise en relation. Aucune donnée médicale ni document de santé n&apos;est stocké.
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-1 accent-primary"
                required
              />
              <span className="text-sm text-ink">
                J&apos;accepte les{" "}
                <Link href="/mentions-legales" className="text-primary underline">
                  conditions générales d&apos;utilisation
                </Link>
              </span>
            </label>
            {fieldErrors.consent_terms && (
              <p className="text-xs text-danger">{fieldErrors.consent_terms}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentData}
                onChange={(e) => setConsentData(e.target.checked)}
                className="mt-1 accent-primary"
                required
              />
              <span className="text-sm text-ink">
                J&apos;accepte le traitement de mes données personnelles pour la mise en relation
                avec un AESH
              </span>
            </label>
            {fieldErrors.consent_data_processing && (
              <p className="text-xs text-danger">{fieldErrors.consent_data_processing}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentMarketing}
                onChange={(e) => setConsentMarketing(e.target.checked)}
                className="mt-1 accent-primary"
              />
              <span className="text-sm text-subtle">
                J&apos;accepte de recevoir des informations sur les services Expat Inclusion
                (optionnel)
              </span>
            </label>
          </section>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {pending
              ? "Enregistrement…"
              : existingProfile
                ? "Mettre à jour mon profil"
                : "Créer mon profil"}
          </button>
        </form>
      </div>
    </div>
  );
}
