"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConversationThread } from "@/components/messaging/ConversationThread";
import { useAuth } from "@/lib/auth-context";

export default function AeshConversationThreadPage() {
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
    if (user.role !== "aesh") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || !user || !Number.isFinite(bookingId) || bookingId <= 0) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/dashboard/aesh/conversations"
        className="text-sm text-subtle hover:text-ink transition-colors"
      >
        ← Retour aux conversations
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-6">Conversation</h1>
      <ConversationThread bookingId={bookingId} />
    </div>
  );
}
