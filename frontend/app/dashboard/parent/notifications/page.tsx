"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";

export default function ParentNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (user.role !== "parent") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || !user) {
    return <Spinner />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/dashboard/parent"
        className="text-sm text-subtle hover:text-ink transition-colors"
      >
        ← Retour au tableau de bord
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-8">Mes notifications</h1>
      <NotificationList />
    </div>
  );
}
