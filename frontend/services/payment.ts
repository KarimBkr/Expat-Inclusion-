const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getXsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function createCheckoutSession(bookingId: number): Promise<string> {
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
      (data as { message?: string }).message ?? "Impossible de lancer le paiement."
    ) as Error & { errors?: Record<string, string[]> };
    err.errors = (data as { errors?: Record<string, string[]> }).errors;
    throw err;
  }

  return (data as { checkout_url: string }).checkout_url;
}
