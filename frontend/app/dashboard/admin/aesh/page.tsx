"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addAdminNote,
  approveAeshProfile,
  getAeshProfile,
  listAeshProfiles,
  publishAeshProfile,
  rejectAeshProfile,
} from "@/services/admin-aesh";
import type { AeshProfileAdmin, AeshVerificationStatus } from "@/types/admin";
import { STATUS_LABELS } from "@/types/admin";

const FILTERS: { value: AeshVerificationStatus | "all"; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Rejetés" },
  { value: "published", label: "Publiés" },
  { value: "all", label: "Tous" },
];

export default function AdminAeshPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<AeshVerificationStatus | "all">("pending");
  const [profiles, setProfiles] = useState<AeshProfileAdmin[]>([]);
  const [selected, setSelected] = useState<AeshProfileAdmin | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await listAeshProfiles(filter === "all" ? undefined : filter);
      setProfiles(data);
    } catch {
      setError("Impossible de charger les profils AESH.");
    } finally {
      setListLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") loadList();
  }, [user, loadList]);

  async function openProfile(id: number) {
    setError("");
    try {
      setSelected(await getAeshProfile(id));
      setRejectReason("");
      setNoteBody("");
    } catch {
      setError("Impossible de charger le profil.");
    }
  }

  async function runAction(action: () => Promise<void>) {
    if (!selected) return;
    setActionPending(true);
    setError("");
    try {
      await action();
      setSelected(await getAeshProfile(selected.id));
      await loadList();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionPending(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-sm text-subtle hover:text-ink">
          ← Administration
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-3">Vérification des profils AESH</h1>
        <p className="text-sm text-subtle mt-1">
          Approuver, rejeter ou publier les profils soumis.
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
              filter === f.value
                ? "bg-primary text-white border-primary"
                : "bg-card border-line text-subtle hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-line rounded-2xl overflow-hidden">
          {listLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="p-8 text-sm text-subtle text-center">Aucun profil pour ce filtre.</p>
          ) : (
            <ul>
              {profiles.map((p) => (
                <li key={p.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => openProfile(p.id)}
                    className={`w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors ${
                      selected?.id === p.id ? "bg-primary-light/50" : ""
                    }`}
                  >
                    <p className="font-medium text-ink">{p.user?.name ?? `AESH #${p.id}`}</p>
                    <p className="text-xs text-subtle mt-0.5">{p.user?.email}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-cream text-subtle">
                      {STATUS_LABELS[p.verification_status]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-line rounded-2xl p-6">
          {!selected ? (
            <p className="text-sm text-subtle text-center py-12">
              Sélectionnez un profil pour voir le détail et agir.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-ink text-lg">{selected.user?.name}</h2>
                <p className="text-sm text-subtle">{selected.user?.email}</p>
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

              {selected.verification_status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => runAction(() => approveAeshProfile(selected.id))}
                    className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-60"
                  >
                    Approuver
                  </button>
                  <div className="flex-1 min-w-[200px] flex gap-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Motif de rejet"
                      className="flex-1 px-3 py-2 text-sm border border-line rounded-xl"
                    />
                    <button
                      type="button"
                      disabled={actionPending || !rejectReason.trim()}
                      onClick={() =>
                        runAction(() => rejectAeshProfile(selected.id, rejectReason.trim()))
                      }
                      className="px-4 py-2 bg-danger text-white text-sm font-semibold rounded-xl disabled:opacity-60"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              )}

              {selected.verification_status === "approved" && (
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() => runAction(() => publishAeshProfile(selected.id))}
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-60"
                >
                  Publier le profil
                </button>
              )}

              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">Notes internes</h3>
                {selected.admin_notes && selected.admin_notes.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {selected.admin_notes.map((note) => (
                      <li key={note.id} className="text-sm bg-cream rounded-xl p-3">
                        <p>{note.body}</p>
                        <p className="text-xs text-subtle mt-1">
                          {note.admin?.name} ·{" "}
                          {new Date(note.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-subtle mb-4">Aucune note pour ce profil.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Ajouter une note interne…"
                    className="flex-1 px-3 py-2 text-sm border border-line rounded-xl"
                  />
                  <button
                    type="button"
                    disabled={actionPending || !noteBody.trim()}
                    onClick={() =>
                      runAction(async () => {
                        await addAdminNote(selected.id, noteBody.trim());
                        setNoteBody("");
                      })
                    }
                    className="px-4 py-2 border border-line text-sm font-medium rounded-xl hover:bg-cream disabled:opacity-60"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
