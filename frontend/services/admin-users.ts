import type { AdminUser } from "@/types/admin";

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

export async function listUsers(role?: string, search?: string): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (search) params.set("search", search);
  const qs = params.size ? `?${params}` : "";
  const res = await apiFetch<{ data: AdminUser[] }>(`/admin/users${qs}`);
  return res.data;
}

export async function getUser(id: number): Promise<AdminUser> {
  const res = await apiFetch<{ data: AdminUser }>(`/admin/users/${id}`);
  return res.data;
}

export async function suspendUser(id: number): Promise<AdminUser> {
  const res = await apiFetch<{ data: AdminUser }>(`/admin/users/${id}/suspend`, { method: "POST" });
  return res.data;
}

export async function reactivateUser(id: number): Promise<AdminUser> {
  const res = await apiFetch<{ data: AdminUser }>(`/admin/users/${id}/reactivate`, {
    method: "POST",
  });
  return res.data;
}
