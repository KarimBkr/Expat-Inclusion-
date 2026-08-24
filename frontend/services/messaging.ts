import type { ConversationSummary, FirebaseTokenResponse } from "@/types/messaging";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getXsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-XSRF-TOKEN": getXsrfToken(),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(
      (data as { message?: string }).message ?? "Une erreur est survenue."
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export async function fetchFirebaseToken(): Promise<FirebaseTokenResponse> {
  return apiFetch<FirebaseTokenResponse>("/firebase/token", { method: "POST" });
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await apiFetch<{ data: ConversationSummary[] }>("/conversations");
  return res.data;
}

export async function getConversation(bookingId: number): Promise<ConversationSummary> {
  const res = await apiFetch<{ data: ConversationSummary }>(`/bookings/${bookingId}/conversation`);
  return res.data;
}
