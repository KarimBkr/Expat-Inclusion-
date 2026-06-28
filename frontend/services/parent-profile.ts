import type {
  ParentProfile,
  ParentProfileResponse,
  Taxonomies,
  UpsertParentProfilePayload,
} from "@/types/parent-profile";

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

export async function getTaxonomies(): Promise<Taxonomies> {
  return apiFetch<Taxonomies>("/taxonomies");
}

export async function getParentProfile(): Promise<ParentProfileResponse> {
  return apiFetch<ParentProfileResponse>("/parent/profile");
}

export async function createParentProfile(
  payload: UpsertParentProfilePayload
): Promise<{ profile: ParentProfile; message: string }> {
  return apiFetch<{ profile: ParentProfile; message: string }>("/parent/profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateParentProfile(
  payload: UpsertParentProfilePayload
): Promise<{ profile: ParentProfile; message: string }> {
  return apiFetch<{ profile: ParentProfile; message: string }>("/parent/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function saveParentProfile(
  payload: UpsertParentProfilePayload,
  exists: boolean
): Promise<{ profile: ParentProfile; message: string }> {
  return exists ? updateParentProfile(payload) : createParentProfile(payload);
}
