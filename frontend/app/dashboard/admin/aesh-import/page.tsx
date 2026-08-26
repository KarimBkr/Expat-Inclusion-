"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { importAeshCsv } from "@/services/admin-aesh-import";
import type { AeshImportReport } from "@/types/aesh-import";

const CSV_COLUMNS = [
  { name: "name", required: true, description: "Nom complet" },
  { name: "email", required: true, description: "Doit être unique" },
  { name: "bio", required: true, description: "50 caractères minimum" },
  { name: "experience_years", required: false, description: "Nombre entier" },
  { name: "timezone", required: true, description: "Ex. Europe/Paris" },
  { name: "phone", required: false, description: "" },
  {
    name: "specialization_slugs",
    required: true,
    description: "Slugs séparés par ; — ex. tsa;tdah",
  },
  { name: "language_codes", required: true, description: "Codes séparés par ; — ex. fr;en" },
  {
    name: "modality_slugs",
    required: true,
    description: "Slugs séparés par ; — ex. presentiel;distanciel",
  },
  { name: "country_codes", required: true, description: "Codes séparés par ; — ex. FR;MA" },
  { name: "school_level_slugs", required: false, description: "Slugs séparés par ;" },
];

export default function AeshImportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<AeshImportReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (user.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setError("");
    setReport(null);

    try {
      setReport(await importAeshCsv(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/dashboard/admin"
        className="text-sm text-subtle hover:text-ink transition-colors"
      >
        ← Retour à l'administration
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Import CSV — profils AESH</h1>
      <p className="text-subtle text-sm mb-8">
        Chaque ligne crée un compte et un profil au statut « en attente » : l'import ne contourne
        pas la vérification, les profils importés passent par le même circuit d'approbation que les
        profils auto-créés.
      </p>

      <div className="bg-card border border-line rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Format attendu</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-subtle border-b border-line">
                <th className="pb-2 pr-4">Colonne</th>
                <th className="pb-2 pr-4">Requise</th>
                <th className="pb-2">Format</th>
              </tr>
            </thead>
            <tbody>
              {CSV_COLUMNS.map((col) => (
                <tr key={col.name} className="border-b border-line last:border-0">
                  <td className="py-1.5 pr-4 font-mono text-ink">{col.name}</td>
                  <td className="py-1.5 pr-4 text-subtle">{col.required ? "Oui" : "Non"}</td>
                  <td className="py-1.5 text-subtle">{col.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-subtle mt-4">
          Le mot de passe du compte créé est aléatoire et n&apos;est jamais communiqué : l&apos;AESH
          l&apos;initialise via « mot de passe oublié » sur son adresse email réelle.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-line rounded-2xl p-6 space-y-4"
      >
        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium text-ink mb-1.5">
            Fichier CSV
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary file:font-medium hover:file:bg-primary/20"
          />
        </div>

        {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}

        <button
          type="submit"
          disabled={!file || submitting}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {submitting ? "Import en cours…" : "Importer"}
        </button>
      </form>

      {report && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-primary-light border border-primary/20 rounded-xl text-sm text-ink">
            {report.message}
          </div>

          {report.imported.length > 0 && (
            <div className="bg-card border border-line rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-ink mb-3">
                Profils importés ({report.imported.length})
              </h2>
              <ul className="space-y-1">
                {report.imported.map((row) => (
                  <li key={row.row} className="text-sm text-subtle">
                    Ligne {row.row} — <span className="text-ink">{row.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.errors.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-danger mb-3">
                Lignes en erreur ({report.errors.length})
              </h2>
              <ul className="space-y-2">
                {report.errors.map((row) => (
                  <li key={row.row} className="text-sm">
                    <span className="font-medium text-ink">Ligne {row.row}</span>
                    <ul className="mt-0.5 ml-4 list-disc text-danger">
                      {row.errors.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
