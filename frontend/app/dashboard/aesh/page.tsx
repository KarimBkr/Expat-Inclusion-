"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardAeshPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "aesh") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bonjour, {user.name}</h1>
          <p className="text-subtle mt-1">Espace AESH · Expat Inclusion</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-subtle hover:text-ink transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      {!user.email_verified_at && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          Votre email n&apos;est pas encore vérifié.{" "}
          <a href="/verifier-email" className="font-medium underline">
            Vérifier maintenant
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard title="Mon profil" value="—" description="Statut de vérification" />
        <DashboardCard title="Demandes reçues" value="—" description="Demandes des parents" />
        <DashboardCard title="Mes documents" value="—" description="Documents uploadés" />
      </div>

      <p className="mt-12 text-sm text-subtle text-center">
        Fonctionnalités disponibles dès le Sprint 2.
      </p>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-line rounded-2xl p-6">
      <p className="text-sm font-medium text-subtle mb-1">{title}</p>
      <p className="text-3xl font-bold text-ink mb-1">{value}</p>
      <p className="text-xs text-subtle">{description}</p>
    </div>
  );
}
