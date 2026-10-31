"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useUnreadConversations } from "@/lib/use-unread-conversations";
import { getAeshDocuments, getAeshProfile } from "@/services/aesh-profile";
import { listBookings } from "@/services/booking";
import { listConversations } from "@/services/messaging";
import { listNotifications } from "@/services/notifications";
import type { AeshDocument, AeshProfile } from "@/types/aesh-profile";
import type { ConversationSummary } from "@/types/messaging";

type Step = { label: string; done: boolean; status: string; cta: string; href: string };

export default function DashboardAeshPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<AeshProfile | null | undefined>(undefined);
  const [documents, setDocuments] = useState<AeshDocument[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { unreadCount } = useUnreadConversations(conversations);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "aesh") router.replace("/dashboard");
  }, [user, loading, router]);

  const load = useCallback(() => {
    setLoadError(false);
    setProfile(undefined);
    // Profile + documents drive the checklist: their failure is shown; counters degrade silently.
    Promise.all([getAeshProfile(), getAeshDocuments()])
      .then(([res, docs]) => {
        setProfile(res.profile);
        setDocuments(docs);
      })
      .catch(() => setLoadError(true));
    listBookings("requested")
      .then((bookings) => setPendingCount(bookings.length))
      .catch(() => setPendingCount(0));
    listConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
    listNotifications()
      .then((res) => setUnreadNotifications(res.unreadCount))
      .catch(() => setUnreadNotifications(0));
  }, []);

  const role = user?.role;
  useEffect(() => {
    if (role === "aesh") load();
  }, [role, load]);

  if (loading || !user) {
    return <Spinner />;
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bonjour, {user.name}</h1>
          <p className="text-subtle mt-1">Espace AESH · Expat Inclusion</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="md:hidden shrink-0 whitespace-nowrap min-h-11 text-sm text-subtle hover:text-ink transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      {loadError ? (
        <div className="mb-8">
          <ErrorState message="Impossible de charger votre candidature." onRetry={load} />
        </div>
      ) : profile === undefined || documents === null ? (
        <Spinner />
      ) : (
        <Onboarding
          steps={buildSteps(Boolean(user.email_verified_at), profile, documents)}
          profile={profile}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          title="Demandes reçues"
          value={pendingCount === null ? "—" : String(pendingCount)}
          description="En attente de votre réponse"
          href="/dashboard/aesh/demandes"
        />
        <DashboardCard
          title="Conversations"
          value={String(conversations.length)}
          description={unreadCount > 0 ? `${unreadCount} non lu(s)` : "Messages avec les familles"}
          href="/dashboard/aesh/conversations"
        />
        <DashboardCard
          title="Notifications"
          value={unreadNotifications === null ? "—" : String(unreadNotifications)}
          description="Non lues"
          href="/dashboard/aesh/notifications"
        />
      </div>
    </div>
  );
}

function documentStep(label: string, doc: AeshDocument | undefined): Step {
  const base = { label, cta: "Gérer mes documents", href: "/dashboard/aesh/documents" };
  if (!doc)
    return {
      ...base,
      done: false,
      status: "À envoyer",
      cta: label === "CV" ? "Envoyer mon CV" : "Envoyer ma lettre",
    };
  if (doc.status === "rejected")
    return {
      ...base,
      done: false,
      status: `Refusé${doc.rejection_reason ? ` : ${doc.rejection_reason}` : ""}`,
      cta: "Remplacer le document",
    };
  return {
    ...base,
    done: true,
    status: doc.status === "approved" ? "Validé" : "Envoyé, en attente de validation",
  };
}

function buildSteps(
  emailVerified: boolean,
  profile: AeshProfile | null,
  documents: AeshDocument[]
): Step[] {
  // Documents are listed newest first: the first of each type is the current one.
  const latest = (type: AeshDocument["type"]) => documents.find((d) => d.type === type);
  const status = profile?.verification_status;
  return [
    {
      label: "Email vérifié",
      done: emailVerified,
      status: emailVerified ? "Vérifié" : "À vérifier",
      cta: "Vérifier mon email",
      href: "/verifier-email",
    },
    {
      label: "Profil complet",
      done: Boolean(profile?.is_complete),
      status: profile === null ? "À créer" : profile.is_complete ? "Complet" : "Incomplet",
      cta: profile === null ? "Créer mon profil" : "Compléter mon profil",
      href: "/dashboard/aesh/profil",
    },
    documentStep("CV", latest("cv")),
    documentStep("Lettre de motivation", latest("cover_letter")),
    {
      label: "Vérification par l'équipe",
      done: status === "approved" || status === "published",
      status:
        status === "published"
          ? "Profil publié"
          : status === "approved"
            ? "Candidature approuvée, publication à venir"
            : status === "rejected"
              ? `Candidature refusée${profile?.rejection_reason ? ` : ${profile.rejection_reason}` : ""}`
              : "En attente",
      cta: "Mettre à jour mon profil",
      href: "/dashboard/aesh/profil",
    },
  ];
}

function nextAction(steps: Step[], profile: AeshProfile | null) {
  const status = profile?.verification_status;
  const todo = steps.slice(0, 4).find((s) => !s.done);
  if (todo)
    return {
      title: `${todo.label} : ${todo.status.toLowerCase()}`,
      text: "Complétez cette étape pour que l'équipe puisse examiner votre candidature.",
      cta: todo.cta,
      href: todo.href,
    };
  if (status === "rejected")
    return {
      title: "Votre candidature a été refusée",
      text:
        profile?.rejection_reason ??
        "Mettez à jour votre profil ou vos documents, puis contactez l'équipe.",
      cta: "Mettre à jour mon profil",
      href: "/dashboard/aesh/profil",
    };
  if (status === "published")
    return {
      title: "Votre profil est visible par les familles",
      text: "Répondez aux demandes reçues : la conversation s'ouvre dès que la famille confirme.",
      cta: "Voir mes demandes",
      href: "/dashboard/aesh/demandes",
    };
  return {
    title: status === "approved" ? "Candidature approuvée" : "Candidature en cours de vérification",
    text:
      status === "approved"
        ? "L'équipe va publier votre profil. Vous serez notifié dès qu'il sera visible."
        : "L'équipe examine votre profil et vos documents. Vous serez notifié de sa décision.",
    cta: "Voir mes documents",
    href: "/dashboard/aesh/documents",
  };
}

function Onboarding({ steps, profile }: { steps: Step[]; profile: AeshProfile | null }) {
  const action = nextAction(steps, profile);
  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      <section
        aria-label="Prochaine étape"
        className="p-6 bg-primary-900 rounded-2xl flex flex-col justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
            Prochaine étape
          </p>
          <p className="font-semibold text-white">{action.title}</p>
          <p className="text-sm text-white/70 mt-1">{action.text}</p>
        </div>
        <Link
          href={action.href}
          className="self-start inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-white text-primary text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          {action.cta}
        </Link>
      </section>
      <section aria-label="Ma candidature" className="p-6 bg-card border border-line rounded-2xl">
        <h2 className="font-semibold text-ink mb-4">Ma candidature</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.done ? "bg-primary text-white" : "border-2 border-line"
                }`}
              >
                {step.done ? "✓" : ""}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {step.label}
                  <span className="sr-only">{step.done ? " (fait)" : " (à faire)"}</span>
                </p>
                <p className="text-xs text-subtle break-words">{step.status}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
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
