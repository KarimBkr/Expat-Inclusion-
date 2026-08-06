import type { BookingRequest, BookingStatus, CreateBookingPayload } from "@/types/booking";

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
    ) as Error & { errors?: Record<string, string[]>; status?: number };
    err.errors = (data as { errors?: Record<string, string[]> }).errors;
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export async function listBookings(status?: BookingStatus): Promise<BookingRequest[]> {
  const query = status ? `?status=${status}` : "";
  const res = await apiFetch<{ data: BookingRequest[] }>(`/bookings${query}`);
  return res.data;
}

export async function getBooking(id: number): Promise<BookingRequest> {
  const res = await apiFetch<{ data: BookingRequest }>(`/bookings/${id}`);
  return res.data;
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingRequest> {
  const res = await apiFetch<{ data: BookingRequest }>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function acceptBooking(id: number): Promise<BookingRequest> {
  const res = await apiFetch<{ data: BookingRequest }>(`/bookings/${id}/accept`, {
    method: "POST",
  });
  return res.data;
}

export async function declineBooking(id: number, reason: string): Promise<BookingRequest> {
  const res = await apiFetch<{ data: BookingRequest }>(`/bookings/${id}/decline`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function cancelBooking(id: number, reason: string): Promise<BookingRequest> {
  const res = await apiFetch<{ data: BookingRequest }>(`/bookings/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return res.data;
}
