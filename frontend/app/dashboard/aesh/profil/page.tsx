"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { useAuth } from "@/lib/auth-context";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import { getAeshProfile, saveAeshProfile } from "@/services/aesh-profile";
import { getTaxonomies } from "@/services/parent-profile";
import type { AeshProfile } from "@/types/aesh-profile";
import type { ApiError } from "@/types/auth";
import type { Taxonomies } from "@/types/parent-profile";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

export default function AeshProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [existingProfile, setExistingProfile] = useState<AeshProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [phone, setPhone] = useState("");
  const [specializationIds, setSpecializationIds] = useState<number[]>([]);
  const [languageIds, setLanguageIds] = useState<number[]>([]);
  const [modalityIds, setModalityIds] = useState<number[]>([]);
  const [countryIds, setCountryIds] = useState<number[]>([]);
  const [schoolLevelIds, setSchoolLevelIds] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [tax, profileRes] = await Promise.all([getTaxonomies(), getAeshProfile()]);
      setTaxonomies(tax);

      if (profileRes.profile) {
        const p = profileRes.profile;
        setExistingProfile(p);
        setBio(p.bio);
        setExperienceYears(p.experience_years !== null ? String(p.experience_years) : "");
        setTimezone(p.timezone);
        setPhone(p.phone ?? "");
        setSpecializationIds(p.specialization_ids ?? []);
        setLanguageIds(p.language_ids ?? []);
        setModalityIds(p.modality_ids ?? []);
        setCountryIds(p.country_ids ?? []);
        setSchoolLevelIds(p.school_level_ids ?? []);
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
    if (user.role !== "aesh") {
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
      const result = await saveAeshProfile(
        {
          bio: bio.trim(),
          experience_years: experienceYears ? Number(experienceYears) : null,
          timezone,
          phone: phone.trim() || null,
          specialization_ids: specializationIds,
          language_ids: languageIds,
          modality_ids: modalityIds,
          country_ids: countryIds,
          school_level_ids: schoolLevelIds,
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
          flat[key.replace(/\.\d+$/, "")] = msgs[0];
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
          href="/dashboard/aesh"
          className="text-sm text-subtle hover:text-ink transition-colors"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Mon profil professionnel</h1>
        <p className="text-subtle text-sm">
          Présentez votre expertise aux familles. Votre profil sera examiné par notre équipe avant
          publication.
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-line p-8">
        {globalError && (
          <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{globalError}</div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-primary-light text-primary text-sm rounded-lg">{success}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-ink">Présentation</h2>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-ink mb-1.5">
                Bio professionnelle
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                minLength={50}
                maxLength={2000}
                rows={6}
                className={inputClass}
                placeholder="Décrivez votre parcours, vos méthodes et votre expérience d'accompagnement (50 caractères minimum)."
              />
              <p className="mt-1 text-xs text-subtle text-right">{bio.length}/2000</p>
              {fieldErrors.bio && <p className="mt-1 text-xs text-danger">{fieldErrors.bio}</p>}
            </div>

            <div>
              <label
                htmlFor="experience_years"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Années d&apos;expérience{" "}
                <span className="text-subtle font-normal">(optionnel)</span>
              </label>
              <input
                id="experience_years"
                type="number"
                min="0"
                max="60"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className={inputClass}
                placeholder="5"
              />
              {fieldErrors.experience_years && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.experience_years}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-ink">Expertise & disponibilité</h2>

            <CheckboxGroup
              legend="Spécialisations"
              hint="Les troubles que vous accompagnez."
              options={taxonomies?.specializations ?? []}
              selected={specializationIds}
              onChange={setSpecializationIds}
              error={fieldErrors.specialization_ids}
            />

            <CheckboxGroup
              legend="Langues parlées"
              options={taxonomies?.languages ?? []}
              selected={languageIds}
              onChange={setLanguageIds}
              error={fieldErrors.language_ids}
            />

            <CheckboxGroup
              legend="Modalités d'accompagnement"
              options={taxonomies?.modalities ?? []}
              selected={modalityIds}
              onChange={setModalityIds}
              error={fieldErrors.modality_ids}
            />

            <CheckboxGroup
              legend="Pays d'intervention"
              options={taxonomies?.countries ?? []}
              selected={countryIds}
              onChange={setCountryIds}
              error={fieldErrors.country_ids}
            />

            <CheckboxGroup
              legend="Niveaux scolaires"
              hint="Optionnel — les niveaux que vous accompagnez."
              options={taxonomies?.school_levels ?? []}
              selected={schoolLevelIds}
              onChange={setSchoolLevelIds}
              error={fieldErrors.school_level_ids}
            />
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
