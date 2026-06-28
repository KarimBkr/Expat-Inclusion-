"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { useAuth } from "@/lib/auth-context";
import { TAXONOMY_TYPES } from "@/types/admin";

export default function AdminTaxonomyPage() {
  const { type } = useParams<{ type: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const meta = TAXONOMY_TYPES.find((t) => t.type === type);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/connexion");
    else if (user.role !== "admin") router.replace("/dashboard");
    else if (!meta) router.replace("/dashboard/admin");
  }, [user, loading, router, meta]);

  if (loading || !user || !meta) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <TaxonomyManager meta={meta} />
    </div>
  );
}
