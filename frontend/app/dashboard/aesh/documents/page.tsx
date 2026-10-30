"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import {
  aeshDocumentDownloadUrl,
  deleteAeshDocument,
  getAeshDocuments,
  uploadAeshDocument,
} from "@/services/aesh-profile";
import type { AeshDocument, DocumentStatus, DocumentType } from "@/types/aesh-profile";
import type { ApiError } from "@/types/auth";

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: "cv", label: "CV" },
  { value: "cover_letter", label: "Lettre de motivation" },
];

const typeLabels: Record<DocumentType, string> = {
  cv: "CV",
  cover_letter: "Lettre de motivation",
};

const statusLabels: Record<DocumentStatus, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Refusé",
};

const statusClass: Record<DocumentStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-primary-light text-primary",
  rejected: "bg-danger/10 text-danger",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function AeshDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<AeshDocument[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [type, setType] = useState<DocumentType>("cv");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoadError(false);
    setPageLoading(true);
    try {
      setDocuments(await getAeshDocuments());
    } catch {
      setLoadError(true);
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
    loadDocuments();
  }, [user, authLoading, router, loadDocuments]);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError("");
    setSuccess("");

    if (!file) {
      setError("Sélectionnez un fichier.");
      return;
    }

    setPending(true);
    try {
      const result = await uploadAeshDocument(type, file);
      setDocuments((prev) => [result.document, ...prev]);
      setSuccess(result.message);
      setFile(null);
      formEl.reset();
    } catch (err) {
      const apiErr = err as ApiError & { errors?: Record<string, string[]> };
      const firstError = apiErr.errors ? Object.values(apiErr.errors)[0]?.[0] : undefined;
      setError(firstError ?? apiErr.message ?? "L'envoi a échoué.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: number) {
    setError("");
    setSuccess("");
    try {
      await deleteAeshDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError((err as ApiError).message ?? "La suppression a échoué.");
    }
  }

  if (authLoading || pageLoading || !user) {
    return <Spinner />;
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <ErrorState message="Impossible de charger vos documents." onRetry={loadDocuments} />
      </div>
    );
  }

  const hasCurrent = (t: DocumentType) =>
    documents.some((d) => d.type === t && d.status !== "rejected");
  const complete = hasCurrent("cv") && hasCurrent("cover_letter");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-2">Ma candidature</h1>
        <p className="text-subtle text-sm">
          Ajoutez votre CV et votre lettre de motivation. Formats acceptés : PDF, DOC, DOCX (5 Mo
          max). Aucune pièce d&apos;identité, aucun diplôme et aucun document médical ne sont
          demandés.
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-line p-8 mb-8">
        {error && (
          <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
        )}
        {success && (
          <div role="status" className="mb-6 p-3 bg-primary-light text-primary text-sm rounded-lg">
            {success}
          </div>
        )}
        {complete && (
          <div className="mb-6 p-3 bg-cream border border-line text-ink text-sm rounded-lg">
            Votre CV et votre lettre sont envoyés : votre candidature est en cours de vérification
            par l&apos;équipe.{" "}
            <Link href="/dashboard/aesh" className="font-medium underline text-primary">
              Suivre ma candidature
            </Link>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-ink mb-1.5">
              Type de document
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full px-4 py-2.5 rounded-xl border border-line bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {documentTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-ink mb-1.5">
              Fichier
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary file:font-medium hover:file:bg-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Envoyer le document"}
          </button>
        </form>
      </div>

      <h2 className="text-lg font-semibold text-ink mb-4">Documents envoyés</h2>

      {documents.length === 0 ? (
        <EmptyState
          title="Aucun document envoyé pour le moment"
          hint="Envoyez votre CV puis votre lettre de motivation pour lancer la vérification."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="bg-card border border-line rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ink truncate">{doc.original_name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusClass[doc.status]}`}
                  >
                    {statusLabels[doc.status]}
                  </span>
                </div>
                <p className="text-xs text-subtle mt-1">
                  {typeLabels[doc.type]} · {formatSize(doc.size)}
                </p>
                {doc.status === "rejected" && doc.rejection_reason && (
                  <p className="text-xs text-danger mt-1">Motif : {doc.rejection_reason}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={aeshDocumentDownloadUrl(doc.id)}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Voir
                </a>
                {doc.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-sm text-subtle hover:text-danger transition-colors"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
