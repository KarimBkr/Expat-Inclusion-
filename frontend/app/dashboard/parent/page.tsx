"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { unreadCount } = useUnreadConversations(conversations);
  const [unreadNotifications, setUnreadNotifications] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "parent") router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role !== "parent") return;
    getParentProfile()
      .then((res) => setProfileComplete(res.is_complete))
      .catch(() => setProfileComplete(false));
    listBookings()
      .then((bookings) => setBookingCount(bookings.length))
      .catch(() => setBookingCount(0));
    listConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
    listNotifications()
      .then((res) => setUnreadNotifications(res.unreadCount))
      .catch(() => setUnreadNotifications(0));
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
          <p className="text-subtle mt-1">Espace parent · Expat Inclusion</p>
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

      {profileComplete === false && (
        <div className="mb-8 p-4 bg-primary-light border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium text-ink">Complétez votre profil parent</p>
            <p className="text-sm text-subtle mt-1">
              Renseignez votre pays, le brief enfant et vos consentements pour accéder à la
              recherche d&apos;AESH.
            </p>
          </div>
          <Link
            href="/dashboard/parent/profil"
            className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Compléter mon profil
          </Link>
        </div>
      )}

      {profileComplete === true && (
        <div className="mb-8 flex items-center justify-between p-4 bg-card border border-line rounded-xl">
          <p className="text-sm text-ink">
            <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
            Profil parent complet
          </p>
          <Link
            href="/dashboard/parent/profil"
            className="text-sm text-primary font-medium hover:underline"
          >
            Modifier
          </Link>
        </div>
      )}

      <div className="mb-8 p-6 bg-primary-900 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-semibold text-white">Trouvez l&apos;AESH qu&apos;il vous faut</p>
          <p className="text-sm text-white/70 mt-1">
            Parcourez les profils examinés par notre équipe et filtrez selon vos besoins.
          </p>
        </div>
        <Link
          href="/dashboard/parent/recherche"
          className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-white text-primary text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          Rechercher un AESH
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Mes demandes"
          value={bookingCount === null ? "—" : String(bookingCount)}
          description="Demandes de réservation"
          href="/dashboard/parent/reservations"
        />
        <DashboardCard title="Mes paiements" value="—" description="Historique paiements" />
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

      <p className="mt-12 text-sm text-subtle text-center">Les paiements arrivent au Sprint 5.</p>
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
