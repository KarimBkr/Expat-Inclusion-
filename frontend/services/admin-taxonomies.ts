import type {
  TaxonomyListResponse,
  TaxonomyMutationResponse,
  TaxonomyRecord,
  TaxonomyType,
} from "@/types/admin";

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

export async function listTaxonomy(type: TaxonomyType): Promise<TaxonomyRecord[]> {
  const res = await apiFetch<TaxonomyListResponse>(`/admin/taxonomies/${type}`);
  return res.data;
}

export async function createTaxonomy(
  type: TaxonomyType,
  payload: Record<string, unknown>
): Promise<TaxonomyMutationResponse> {
  return apiFetch<TaxonomyMutationResponse>(`/admin/taxonomies/${type}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTaxonomy(
  type: TaxonomyType,
  id: number,
  payload: Record<string, unknown>
): Promise<TaxonomyMutationResponse> {
  return apiFetch<TaxonomyMutationResponse>(`/admin/taxonomies/${type}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTaxonomy(type: TaxonomyType, id: number): Promise<void> {
  await apiFetch<{ message: string }>(`/admin/taxonomies/${type}/${id}`, {
    method: "DELETE",
  });
}
