"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
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
  }, [user, loading, router]);

  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
