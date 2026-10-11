import type { AdminBooking, AdminNote } from "@/types/admin";

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
    throw new Error((data as { message?: string }).message ?? "Une erreur est survenue.");
  }

  return data as T;
}

export async function listBookings(status?: string): Promise<AdminBooking[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiFetch<{ data: AdminBooking[] }>(`/admin/bookings${qs}`);
  return res.data;
}

export async function getBooking(id: number): Promise<AdminBooking> {
  const res = await apiFetch<{ data: AdminBooking }>(`/admin/bookings/${id}`);
  return res.data;
}

export async function addBookingNote(id: number, body: string): Promise<AdminNote> {
  const res = await apiFetch<{ data: AdminNote }>(`/admin/bookings/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return res.data;
}
