const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getXsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/** Frais désactivé : la demande est déjà confirmée côté serveur, aucune redirection n'est nécessaire. */
export async function createCheckoutSession(
  bookingId: number
): Promise<{ checkoutUrl: string; paymentsEnabled: boolean }> {
  const res = await fetch(`${API_URL}/api/bookings/${bookingId}/pay`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-XSRF-TOKEN": getXsrfToken(),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(
      (data as { message?: string }).message ?? "Impossible de confirmer la mise en relation."
    ) as Error & { errors?: Record<string, string[]> };
    err.errors = (data as { errors?: Record<string, string[]> }).errors;
    throw err;
  }

  const { checkout_url, payments_enabled } = data as {
    checkout_url: string;
    payments_enabled?: boolean;
  };
  return { checkoutUrl: checkout_url, paymentsEnabled: payments_enabled !== false };
}
