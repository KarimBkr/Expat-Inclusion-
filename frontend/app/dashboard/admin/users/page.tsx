"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { getUser, listUsers, reactivateUser, suspendUser } from "@/services/admin-users";
import type { AdminUser, UserRole } from "@/types/admin";
import { STATUS_LABELS, USER_ROLE_LABELS } from "@/types/admin";

const FILTERS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "parent", label: "Parents" },
  { value: "aesh", label: "AESH" },
  { value: "admin", label: "Admins" },
];

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await listUsers(filter === "all" ? undefined : filter, search || undefined);
      setUsers(data);
    } catch {
      setListError("Impossible de charger les utilisateurs.");
    } finally {
      setListLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") loadList();
  }, [user, loadList]);

  async function openUser(id: number) {
    setError("");
    setNotice("");
    setConfirming(false);
    try {
      setSelected(await getUser(id));
    } catch {
      setError("Impossible de charger l'utilisateur.");
    }
  }

  async function runAction(action: () => Promise<unknown>, done: string) {
    if (!selected) return;
    setActionPending(true);
    setError("");
    setNotice("");
    try {
      await action();
      setConfirming(false);
      setNotice(done);
      setSelected(await getUser(selected.id));
      await loadList();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionPending(false);
    }
  }

  if (loading || !user) {
    return <Spinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-sm text-subtle hover:text-ink">
          ← Administration
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-3">Utilisateurs</h1>
        <p className="text-sm text-subtle mt-1">
          Suspendre bloque la connexion sans supprimer le compte ni ses données.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
          {error}
        </div>
      )}

      <search className="block mb-4 max-w-md">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <input
            type="search"
            aria-label="Rechercher un utilisateur"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!e.target.value) setSearch("");
            }}
            placeholder="Nom ou email…"
            className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-line rounded-xl bg-card"
          />
          <button
            type="submit"
            className="px-4 py-2.5 min-h-11 border border-line text-sm font-medium rounded-xl hover:bg-cream"
          >
            Rechercher
          </button>
        </form>
      </search>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
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
        <section
          aria-label="Liste des utilisateurs"
          className="bg-card border border-line rounded-2xl overflow-hidden"
        >
          {listLoading ? (
            <Spinner label="Chargement des utilisateurs…" />
          ) : listError ? (
            <ErrorState message={listError} onRetry={loadList} />
          ) : users.length === 0 ? (
            <EmptyState
              title="Aucun utilisateur trouvé"
              hint={
                search
                  ? `Aucun résultat pour « ${search} » avec ce filtre.`
                  : "Aucun compte pour ce filtre."
              }
            />
          ) : (
            <ul>
              {users.map((u) => (
                <li key={u.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => openUser(u.id)}
                    className={`w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors ${
                      selected?.id === u.id ? "bg-primary-light/50" : ""
                    }`}
                  >
                    <p className="font-medium text-ink">{u.name}</p>
                    <p className="text-xs text-subtle mt-0.5">{u.email}</p>
                    <span className="inline-flex flex-wrap gap-1.5 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cream text-subtle">
                        {USER_ROLE_LABELS[u.role]}
                      </span>
                      {u.suspended_at && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                          Suspendu
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
          aria-label="Détail de l'utilisateur"
          className="bg-card border border-line rounded-2xl p-6"
        >
          {!selected ? (
            <p className="text-sm text-subtle text-center py-12">
              Sélectionnez un utilisateur pour voir le détail et agir.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-ink text-lg">{selected.name}</h2>
                <p className="text-sm text-subtle">{selected.email}</p>
                <p className="mt-3 text-sm">
                  Rôle : <strong>{USER_ROLE_LABELS[selected.role]}</strong>
                </p>
                {selected.role === "aesh" && selected.aesh_verification_status && (
                  <p className="text-sm text-subtle">
                    Vérification profil : {STATUS_LABELS[selected.aesh_verification_status]}
                  </p>
                )}
                <p className="text-sm text-subtle">
                  Email vérifié : {selected.email_verified_at ? "oui" : "non"}
                </p>
              </div>

              {notice && (
                <p
                  role="status"
                  className="text-sm text-primary bg-primary-light/50 rounded-xl p-3"
                >
                  {notice}
                </p>
              )}

              {selected.role === "admin" ? (
                <p className="border-t border-line pt-4 text-xs text-subtle">
                  Un compte administrateur ne peut pas être suspendu.
                </p>
              ) : (
                <div className="border-t border-line pt-4 space-y-3">
                  {selected.suspended_at && (
                    <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-danger/10 text-danger font-medium">
                      Suspendu le {new Date(selected.suspended_at).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  {confirming ? (
                    <div className="bg-cream rounded-xl p-4 space-y-3">
                      <p className="text-sm text-ink">
                        {selected.suspended_at
                          ? `Réactiver le compte de ${selected.name} ? La connexion sera de nouveau possible.`
                          : `Suspendre le compte de ${selected.name} ? La connexion sera bloquée, ses données sont conservées.`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionPending}
                          onClick={() =>
                            selected.suspended_at
                              ? runAction(() => reactivateUser(selected.id), "Compte réactivé.")
                              : runAction(() => suspendUser(selected.id), "Compte suspendu.")
                          }
                          className={`px-4 py-2.5 min-h-11 text-sm font-semibold rounded-xl disabled:opacity-60 ${
                            selected.suspended_at ? "bg-primary text-white" : "bg-danger text-white"
                          }`}
                        >
                          {selected.suspended_at
                            ? "Confirmer la réactivation"
                            : "Confirmer la suspension"}
                        </button>
                        <button
                          type="button"
                          disabled={actionPending}
                          onClick={() => setConfirming(false)}
                          className="px-4 py-2.5 min-h-11 border border-line text-sm font-medium rounded-xl hover:bg-card"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : selected.suspended_at ? (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="block px-4 py-2.5 min-h-11 border border-line text-sm font-medium rounded-xl hover:border-primary"
                    >
                      Réactiver le compte
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="block px-4 py-2.5 min-h-11 bg-danger text-white text-sm font-semibold rounded-xl"
                    >
                      Suspendre le compte
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
