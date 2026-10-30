"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import {
  addAdminNote,
  adminDocumentDownloadUrl,
  approveAeshProfile,
  getAeshProfile,
  interviewVerifyAeshProfile,
  listAeshProfiles,
  publishAeshProfile,
  rejectAeshProfile,
  removeInterviewVerification,
  sendInterviewInvitation,
} from "@/services/admin-aesh";
import type { AeshProfileAdmin, AeshVerificationStatus } from "@/types/admin";
import { STATUS_LABELS } from "@/types/admin";
import { DOCUMENT_TYPE_LABELS } from "@/types/aesh-profile";

const FILTERS: { value: AeshVerificationStatus | "all"; label: string }[] = [
  { value: "pending", label: "À vérifier" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Rejetés" },
  { value: "published", label: "Publiés" },
  { value: "all", label: "Tous" },
];

const EMPTY_HINTS: Record<AeshVerificationStatus | "all", string> = {
  pending:
    "Aucune candidature n'attend de vérification. Les nouveaux profils AESH apparaîtront ici.",
  approved: "Aucun profil approuvé en attente de publication.",
  rejected: "Aucun profil rejeté.",
  published: "Aucun profil publié pour l'instant.",
  all: "Aucun profil AESH inscrit pour l'instant.",
};

const STATUS_CLASS: Record<AeshVerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-primary-light text-primary",
  rejected: "bg-danger/10 text-danger",
  published: "bg-primary text-white",
};

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-line rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

export default function AdminAeshPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const ids = useId();
  const detailRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState<AeshVerificationStatus | "all">("pending");
  const [profiles, setProfiles] = useState<AeshProfileAdmin[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [selected, setSelected] = useState<AeshProfileAdmin | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(false);
    try {
      setProfiles(await listAeshProfiles(filter === "all" ? undefined : filter));
    } catch {
      setListError(true);
    } finally {
      setListLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  const isAdmin = user?.role === "admin";
  useEffect(() => {
    if (isAdmin) loadList();
  }, [isAdmin, loadList]);

  async function openProfile(id: number) {
    setError("");
    setNotice("");
    setRejecting(false);
    setRejectReason("");
    setNoteBody("");
    // Pré-rempli avec le lien de réservation mémorisé de l'admin : saisi une seule fois.
    setMeetingLink(user?.scheduling_link ?? "");
    setInviteMessage("");
    setDetailLoading(true);
    try {
      setSelected(await getAeshProfile(id));
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("Impossible de charger ce profil. Réessayez.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction(action: () => Promise<void>, success: string) {
    if (!selected) return;
    setActionPending(true);
    setError("");
    setNotice("");
    try {
      await action();
      setSelected(await getAeshProfile(selected.id));
      setNotice(success);
      await loadList();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionPending(false);
    }
  }

  if (loading || !user) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Vérification des profils AESH</h1>
        <p className="text-sm text-subtle mt-1">
          Consultez les documents, puis approuvez, rejetez avec un motif ou publiez.
        </p>
      </div>

      <fieldset className="flex flex-wrap gap-2 mb-6">
        <legend className="sr-only">Filtrer par statut</legend>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`min-h-11 px-4 text-sm rounded-xl border transition-colors ${
              filter === f.value
                ? "bg-primary text-white border-primary"
                : "bg-card border-line text-subtle hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </fieldset>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label="Liste des profils" className="min-w-0">
          {listLoading ? (
            <Spinner label="Chargement des profils…" />
          ) : listError ? (
            <ErrorState message="Impossible de charger les profils AESH." onRetry={loadList} />
          ) : profiles.length === 0 ? (
            <EmptyState title="Aucun profil" hint={EMPTY_HINTS[filter]} />
          ) : (
            <ul className="bg-card border border-line rounded-2xl overflow-hidden">
              {profiles.map((p) => (
                <li key={p.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => openProfile(p.id)}
                    aria-current={selected?.id === p.id ? "true" : undefined}
                    className={`w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors ${
                      selected?.id === p.id ? "bg-primary-light/50" : ""
                    }`}
                  >
                    <span className="block font-medium text-ink">
                      {p.user?.name ?? `AESH #${p.id}`}
                    </span>
                    <span className="block text-xs text-subtle mt-0.5 break-all">
                      {p.user?.email}
                    </span>
                    <span className="flex flex-wrap gap-1.5 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[p.verification_status]}`}
                      >
                        {STATUS_LABELS[p.verification_status]}
                      </span>
                      {p.interview_verified_at && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">
                          Entretien ✓
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          ref={detailRef}
          aria-label="Détail du profil"
          className="min-w-0 bg-card border border-line rounded-2xl p-5 sm:p-6 scroll-mt-4"
        >
          {error && (
            <p role="alert" className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mb-4 p-3 bg-primary-light text-primary text-sm rounded-lg">
              {notice}
            </p>
          )}
          {detailLoading ? (
            <Spinner label="Chargement du profil…" />
          ) : !selected ? (
            <p className="text-sm text-subtle text-center py-12">
              Sélectionnez un profil pour voir ses documents et agir.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-ink text-lg">{selected.user?.name}</h2>
                <p className="text-sm text-subtle break-all">{selected.user?.email}</p>
                <p className="mt-3 text-sm">
                  Statut : <strong>{STATUS_LABELS[selected.verification_status]}</strong>
                </p>
                {selected.bio && (
                  <p className="mt-3 text-sm text-ink bg-cream rounded-xl p-4">{selected.bio}</p>
                )}
                {selected.rejection_reason && (
                  <p className="mt-3 text-sm text-danger">Motif : {selected.rejection_reason}</p>
                )}
              </div>

              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink mb-3">Documents</h3>
                {selected.documents && selected.documents.length > 0 ? (
                  <ul className="space-y-2">
                    {selected.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between gap-3 bg-cream rounded-xl px-4 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink">
                            {DOCUMENT_TYPE_LABELS[doc.type]}
                          </span>
                          <span className="block text-xs text-subtle truncate">
                            {doc.original_name}
                          </span>
                        </span>
                        <a
                          href={adminDocumentDownloadUrl(doc.id)}
                          className="shrink-0 inline-flex items-center min-h-11 text-sm text-primary font-medium hover:underline"
                        >
                          Ouvrir
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-subtle">
                    Aucun document déposé : le CV et la lettre de motivation sont attendus avant
                    d&apos;approuver.
                  </p>
                )}
              </div>

              {selected.verification_status === "pending" && (
                <div className="border-t border-line pt-4">
                  <h3 className="text-sm font-semibold text-ink mb-3">Décision</h3>
                  {!rejecting ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="min-h-11"
                        disabled={actionPending}
                        onClick={() =>
                          runAction(
                            () => approveAeshProfile(selected.id),
                            "Profil approuvé. Vous pouvez maintenant le publier."
                          )
                        }
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-11 border-danger text-danger hover:bg-danger/10"
                        disabled={actionPending}
                        onClick={() => setRejecting(true)}
                      >
                        Rejeter…
                      </Button>
                    </div>
                  ) : (
                    <form
                      className="space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        runAction(
                          () => rejectAeshProfile(selected.id, rejectReason.trim()),
                          "Profil rejeté. L'AESH verra le motif dans son espace."
                        );
                      }}
                    >
                      <div>
                        <label
                          htmlFor={`${ids}-reason`}
                          className="block text-sm font-medium text-ink mb-1"
                        >
                          Motif du rejet (obligatoire, visible par l&apos;AESH)
                        </label>
                        <textarea
                          id={`${ids}-reason`}
                          required
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={actionPending || !rejectReason.trim()}
                          className="min-h-11 px-4 bg-danger text-white text-sm font-semibold rounded-lg disabled:opacity-60"
                        >
                          Confirmer le rejet
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="min-h-11"
                          onClick={() => setRejecting(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {selected.verification_status === "approved" && (
                <div className="border-t border-line pt-4">
                  <h3 className="text-sm font-semibold text-ink mb-1">Publication</h3>
                  <p className="text-xs text-subtle mb-3">
                    Une fois publié, le profil apparaît dans la recherche des familles.
                  </p>
                  <Button
                    size="sm"
                    className="min-h-11"
                    disabled={actionPending}
                    onClick={() =>
                      runAction(
                        () => publishAeshProfile(selected.id),
                        "Profil publié : il est visible dans la recherche."
                      )
                    }
                  >
                    Publier le profil
                  </Button>
                </div>
              )}

              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink mb-1">Vérification renforcée</h3>
                <p className="text-xs text-subtle mb-3">
                  En cas de doute sur une compétence revendiquée (ex. TSA), menez un entretien hors
                  plateforme, puis enregistrez le résultat ici. Indépendant du statut.
                </p>
                {selected.interview_verified_at ? (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary-light text-primary font-medium">
                      Compétences vérifiées par entretien ·{" "}
                      {new Date(selected.interview_verified_at).toLocaleDateString("fr-FR")}
                    </span>
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => {
                        if (window.confirm("Retirer la vérification par entretien ?"))
                          runAction(
                            () => removeInterviewVerification(selected.id),
                            "Vérification par entretien retirée."
                          );
                      }}
                      className="min-h-11 text-xs text-subtle hover:text-danger underline disabled:opacity-60"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor={`${ids}-link`}
                        className="block text-xs font-medium text-subtle mb-1"
                      >
                        Lien de planification (Google Calendar, Microsoft Bookings…)
                      </label>
                      <input
                        id={`${ids}-link`}
                        type="url"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://calendar.app.google/…"
                        className={inputClass}
                      />
                      <p className="text-xs text-subtle mt-1">
                        Mémorisé après le premier envoi, pré-rempli la prochaine fois.
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor={`${ids}-message`}
                        className="block text-xs font-medium text-subtle mb-1"
                      >
                        Message (optionnel)
                      </label>
                      <input
                        id={`${ids}-message`}
                        type="text"
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        disabled={actionPending || !meetingLink.trim()}
                        onClick={() =>
                          runAction(async () => {
                            await sendInterviewInvitation(
                              selected.id,
                              meetingLink.trim(),
                              inviteMessage.trim()
                            );
                            setInviteMessage("");
                          }, "Invitation envoyée par email. Une fois l'entretien mené, marquez-le comme concluant.")
                        }
                      >
                        Envoyer l&apos;invitation
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        disabled={actionPending}
                        onClick={() =>
                          runAction(
                            () => interviewVerifyAeshProfile(selected.id),
                            "Entretien enregistré comme concluant."
                          )
                        }
                      >
                        Entretien concluant
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink mb-3">Notes internes</h3>
                {selected.admin_notes && selected.admin_notes.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {selected.admin_notes.map((note) => (
                      <li key={note.id} className="text-sm bg-cream rounded-xl p-3 break-words">
                        <p>{note.body}</p>
                        <p className="text-xs text-subtle mt-1">
                          {note.admin?.name} ·{" "}
                          {new Date(note.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-subtle mb-4">
                    Aucune note. Les notes ne sont visibles que des administrateurs.
                  </p>
                )}
                <form
                  className="flex flex-col sm:flex-row gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runAction(async () => {
                      await addAdminNote(selected.id, noteBody.trim());
                      setNoteBody("");
                    }, "Note ajoutée.");
                  }}
                >
                  <label htmlFor={`${ids}-note`} className="sr-only">
                    Nouvelle note interne
                  </label>
                  <input
                    id={`${ids}-note`}
                    type="text"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Ajouter une note interne…"
                    className={`${inputClass} sm:flex-1`}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    disabled={actionPending || !noteBody.trim()}
                  >
                    Ajouter
                  </Button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
