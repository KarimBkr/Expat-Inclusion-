"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUser, listUsers, reactivateUser, suspendUser } from "@/services/admin-users";
import type { AdminUser, UserRole } from "@/types/admin";

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
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await listUsers(filter === "all" ? undefined : filter);
      setUsers(data);
    } catch {
      setError("Impossible de charger les utilisateurs.");
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

  async function openUser(id: number) {
    setError("");
    try {
      setSelected(await getUser(id));
    } catch {
      setError("Impossible de charger l'utilisateur.");
    }
  }

  async function runAction(action: () => Promise<void>) {
    if (!selected) return;
    setActionPending(true);
    setError("");
    try {
      await action();
      setSelected(await getUser(selected.id));
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
        <h1 className="text-2xl font-bold text-ink mt-3">Utilisateurs</h1>
        <p className="text-sm text-subtle mt-1">
          Suspendre bloque la connexion sans supprimer le compte ni ses données.
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
          ) : users.length === 0 ? (
            <p className="p-8 text-sm text-subtle text-center">Aucun utilisateur pour ce filtre.</p>
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
                        {u.role}
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
        </div>

        <div className="bg-card border border-line rounded-2xl p-6">
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
                  Rôle : <strong>{selected.role}</strong>
                </p>
                {selected.role === "aesh" && selected.aesh_verification_status && (
                  <p className="text-sm text-subtle">
                    Vérification profil : {selected.aesh_verification_status}
                  </p>
                )}
                <p className="text-sm text-subtle">
                  Email vérifié : {selected.email_verified_at ? "oui" : "non"}
                </p>
              </div>

              {selected.role !== "admin" && (
                <div className="border-t border-line pt-4">
                  {selected.suspended_at ? (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-danger/10 text-danger font-medium">
                        Suspendu le {new Date(selected.suspended_at).toLocaleDateString("fr-FR")}
                      </span>
                      <button
                        type="button"
                        disabled={actionPending}
                        onClick={() => runAction(() => reactivateUser(selected.id).then(() => {}))}
                        className="px-4 py-2 border border-line text-sm font-medium rounded-xl hover:border-primary disabled:opacity-60"
                      >
                        Réactiver
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => runAction(() => suspendUser(selected.id).then(() => {}))}
                      className="px-4 py-2 bg-danger text-white text-sm font-semibold rounded-xl disabled:opacity-60"
                    >
                      Suspendre le compte
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
