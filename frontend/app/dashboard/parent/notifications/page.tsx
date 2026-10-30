"use client";

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
      <h1 className="text-2xl font-bold text-ink mb-8">Mes notifications</h1>
      <NotificationList />
    </div>
  );
}
