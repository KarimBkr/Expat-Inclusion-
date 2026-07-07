"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAeshDocuments, getAeshProfile } from "@/services/aesh-profile";
import type { AeshProfile } from "@/types/aesh-profile";

const verificationLabel: Record<AeshProfile["verification_status"], string> = {
  pending: "En attente de vérification",
  approved: "Profil vérifié",
  rejected: "Vérification refusée",
};

const verificationClass: Record<AeshProfile["verification_status"], string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-primary-light text-primary border-primary/20",
  rejected: "bg-danger/10 text-danger border-danger/20",
};

export default function DashboardAeshPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<AeshProfile | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "aesh") router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role !== "aesh") return;
    getAeshProfile()
      .then((res) => setProfile(res.profile))
      .catch(() => setProfile(null));
    getAeshDocuments()
      .then((docs) => setDocCount(docs.length))
      .catch(() => setDocCount(0));
  }, [user]);

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

      {profile === null && (
        <div className="mb-8 p-4 bg-primary-light border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium text-ink">Complétez votre profil professionnel</p>
            <p className="text-sm text-subtle mt-1">
              Présentez votre expertise, vos langues, vos pays d&apos;intervention et votre tarif
              pour être visible auprès des familles.
            </p>
          </div>
          <Link
            href="/dashboard/aesh/profil"
            className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Compléter mon profil
          </Link>
        </div>
      )}

      {profile !== null && (
        <div
          className={`mb-8 flex items-center justify-between p-4 border rounded-xl ${verificationClass[profile.verification_status]}`}
        >
          <p className="text-sm font-medium">
            {verificationLabel[profile.verification_status]}
            {!profile.is_complete && " · profil incomplet"}
          </p>
          <Link href="/dashboard/aesh/profil" className="text-sm font-medium hover:underline">
            Modifier
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          title="Mon profil"
          value={profile === null ? "À créer" : profile.is_complete ? "Complet" : "Incomplet"}
          description="Profil professionnel"
          href="/dashboard/aesh/profil"
        />
        <DashboardCard
          title="Mes documents"
          value={docCount === null ? "—" : String(docCount)}
          description="Pièces de vérification"
          href="/dashboard/aesh/documents"
        />
        <DashboardCard title="Demandes reçues" value="—" description="Demandes des parents" />
      </div>

      <p className="mt-12 text-sm text-subtle text-center">
        Les demandes des parents arriveront dès le Sprint 4.
      </p>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="bg-card border border-line rounded-2xl p-6 h-full">
      <p className="text-sm font-medium text-subtle mb-1">{title}</p>
      <p className="text-3xl font-bold text-ink mb-1">{value}</p>
      <p className="text-xs text-subtle">{description}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
