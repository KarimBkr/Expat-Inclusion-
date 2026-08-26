"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { verifyEmail } from "@/services/auth";
import type { ApiError } from "@/types/auth";

type Status = "pending" | "success" | "expired" | "unauthenticated" | "error";

function Confirmation() {
  const params = useParams<{ id: string; hash: string }>();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    let cancelled = false;

    verifyEmail(params.id, params.hash, searchParams.toString())
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        if (err.status === 401) setStatus("unauthenticated");
        else if (err.status === 403) setStatus("expired");
        else setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id, params.hash, searchParams]);

  if (status === "pending") {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <p className="text-ink font-medium mb-4">Votre adresse email est vérifiée.</p>
        <Link href="/dashboard" className="text-primary font-medium hover:underline">
          Accéder à mon espace
        </Link>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center">
        <p className="text-subtle mb-4">
          Reconnectez-vous pour finaliser la vérification de cet email.
        </p>
        <Link href="/connexion" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="text-center">
        <p className="text-subtle mb-4">Ce lien de vérification a expiré ou est invalide.</p>
        <Link href="/verifier-email" className="text-primary font-medium hover:underline">
          Renvoyer un email de vérification
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-danger mb-4">Une erreur est survenue. Réessayez plus tard.</p>
    </div>
  );
}

export default function ConfirmerVerificationEmailPage() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Vérification de l&apos;email</h1>
        </div>
        <Suspense>
          <Confirmation />
        </Suspense>
      </div>
    </div>
  );
}
