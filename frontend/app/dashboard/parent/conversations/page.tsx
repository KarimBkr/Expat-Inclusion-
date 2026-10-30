"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConversationInbox } from "@/components/messaging/ConversationInbox";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";

export default function ParentConversationsPage() {
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
      <h1 className="text-2xl font-bold text-ink mt-4 mb-2">Mes conversations</h1>
      <p className="text-subtle text-sm mb-8">
        Échangez avec les AESH une fois votre demande acceptée.
      </p>
      <ConversationInbox
        basePath="/dashboard/parent/conversations"
        emptyHint="Acceptez une mise en relation (demande acceptée) pour ouvrir un fil de discussion."
      />
    </div>
  );
}
