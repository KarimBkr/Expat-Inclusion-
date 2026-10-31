"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";
import { useUnreadConversations } from "@/lib/use-unread-conversations";
import { listBookings } from "@/services/booking";
import { listConversations } from "@/services/messaging";
import { listNotifications } from "@/services/notifications";
import { getParentProfile } from "@/services/parent-profile";
import type { ConversationSummary } from "@/types/messaging";

export default function DashboardParentPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { unreadCount } = useUnreadConversations(conversations);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "parent") router.replace("/dashboard");
  }, [user, loading, router]);

  const load = useCallback(() => {
    setLoadError(false);
    setProfileComplete(null);
    // Profile + bookings decide the next action: their failure is shown; counters degrade silently.
    Promise.all([getParentProfile(), listBookings()])
      .then(([profile, bookings]) => {
        setProfileComplete(profile.is_complete);
        setBookingCount(bookings.length);
        setAcceptedCount(bookings.filter((b) => b.status === "accepted").length);
      })
      .catch(() => setLoadError(true));
    listConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
    listNotifications()
      .then((res) => setUnreadNotifications(res.unreadCount))
      .catch(() => setUnreadNotifications(0));
  }, []);

  useEffect(() => {
    if (user?.role === "parent") load();
  }, [user, load]);

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
          <p className="text-subtle mt-1">Espace parent · Expat Inclusion</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="md:hidden shrink-0 whitespace-nowrap min-h-11 text-sm text-subtle hover:text-ink transition-colors"
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

      {loadError ? (
        <div className="mb-8">
          <ErrorState message="Impossible de charger votre espace." onRetry={load} />
        </div>
      ) : profileComplete === null ? (
        <Spinner />
      ) : (
        <NextActionCard
          profileComplete={profileComplete}
          acceptedCount={acceptedCount}
          bookingCount={bookingCount ?? 0}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Mes demandes"
          value={bookingCount === null ? "—" : String(bookingCount)}
          description="Demandes de mise en relation"
          href="/dashboard/parent/reservations"
        />
        <DashboardCard
          title="Mes conversations"
          value={String(conversations.length)}
          description={unreadCount > 0 ? `${unreadCount} non lu(s)` : "Messages avec les AESH"}
          href="/dashboard/parent/conversations"
        />
        <DashboardCard
          title="Notifications"
          value={unreadNotifications === null ? "—" : String(unreadNotifications)}
          description="Non lues"
          href="/dashboard/parent/notifications"
        />
      </div>

      <p className="mt-12 text-sm text-subtle text-center">
        Le tarif se fixe directement avec l&apos;AESH via la messagerie : la plateforme ne gère
        aucun paiement.
      </p>
    </div>
  );
}

function NextActionCard({
  profileComplete,
  acceptedCount,
  bookingCount,
}: {
  profileComplete: boolean;
  acceptedCount: number;
  bookingCount: number;
}) {
  const action = !profileComplete
    ? {
        title: "Complétez votre profil parent",
        text: "Renseignez votre pays, le brief enfant et vos consentements pour que les AESH comprennent votre besoin.",
        cta: "Compléter mon profil",
        href: "/dashboard/parent/profil",
      }
    : acceptedCount > 0
      ? {
          title:
            acceptedCount > 1
              ? `${acceptedCount} demandes ont été acceptées`
              : "Une demande a été acceptée",
          text: "Confirmez la mise en relation pour ouvrir la conversation avec l'AESH.",
          cta: "Confirmer la mise en relation",
          href: "/dashboard/parent/reservations",
        }
      : bookingCount === 0
        ? {
            title: "Trouvez l'AESH qu'il vous faut",
            text: "Parcourez les profils examinés par notre équipe et filtrez selon vos besoins.",
            cta: "Rechercher un AESH",
            href: "/dashboard/parent/recherche",
          }
        : {
            title: "Suivez vos demandes",
            text: "Vous serez notifié dès qu'un AESH répond. Vous pouvez aussi contacter d'autres profils.",
            cta: "Voir mes demandes",
            href: "/dashboard/parent/reservations",
          };

  return (
    <section
      aria-label="Prochaine étape"
      className="mb-8 p-6 bg-primary-900 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
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
        className="shrink-0 inline-flex items-center justify-center min-h-11 px-5 py-2.5 bg-white text-primary text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
      >
        {action.cta}
      </Link>
    </section>
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
