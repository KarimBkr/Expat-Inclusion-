import type { AdminNote, AeshProfileAdmin } from "@/types/admin";

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

export async function listAeshProfiles(status?: string): Promise<AeshProfileAdmin[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiFetch<{ data: AeshProfileAdmin[] }>(`/admin/aesh-profiles${qs}`);
  return res.data;
}

export async function getAeshProfile(id: number): Promise<AeshProfileAdmin> {
  const res = await apiFetch<{ data: AeshProfileAdmin }>(`/admin/aesh-profiles/${id}`);
  return res.data;
}

export async function approveAeshProfile(id: number): Promise<void> {
  await apiFetch(`/admin/aesh-profiles/${id}/approve`, { method: "POST" });
}

export async function rejectAeshProfile(id: number, rejectionReason: string): Promise<void> {
  await apiFetch(`/admin/aesh-profiles/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
}

export async function publishAeshProfile(id: number): Promise<void> {
  await apiFetch(`/admin/aesh-profiles/${id}/publish`, { method: "POST" });
}

export async function addAdminNote(id: number, body: string): Promise<AdminNote> {
  const res = await apiFetch<{ data: AdminNote }>(`/admin/aesh-profiles/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return res.data;
}
