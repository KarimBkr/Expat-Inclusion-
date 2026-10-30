"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConversationThread } from "@/components/messaging/ConversationThread";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";

export default function ParentConversationThreadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = Number(params.bookingId);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (user.role !== "parent") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || !user || !Number.isFinite(bookingId) || bookingId <= 0) {
    return <Spinner />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/dashboard/parent/conversations"
        className="text-sm text-subtle hover:text-ink transition-colors"
      >
        ← Retour aux conversations
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-6">Conversation</h1>
      <ConversationThread bookingId={bookingId} />
    </div>
  );
}
