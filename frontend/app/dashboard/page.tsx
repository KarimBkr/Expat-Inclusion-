"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth-context";

export default function DashboardRedirectPage() {
  const { user, loading, error, refresh } = useAuth();
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (loading || retrying || error) return;
    if (!user) {
      router.replace("/connexion");
      return;
    }
    if (user.role === "aesh") {
      router.replace("/dashboard/aesh");
    } else if (user.role === "parent") {
      router.replace("/dashboard/parent");
    } else if (user.role === "admin") {
      router.replace("/dashboard/admin");
    } else {
      router.replace("/");
    }
  }, [user, loading, retrying, error, router]);

  if (error && !retrying) {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <ErrorState
          message="Impossible de récupérer votre compte pour le moment. Vérifiez votre connexion puis réessayez."
          onRetry={() => {
            setRetrying(true);
            refresh().finally(() => setRetrying(false));
          }}
        />
      </div>
    );
  }

  return <Spinner label="Ouverture de votre espace…" />;
}
