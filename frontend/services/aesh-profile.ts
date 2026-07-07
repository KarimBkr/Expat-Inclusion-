import type {
  AeshDocument,
  AeshProfile,
  AeshProfileResponse,
  DocumentType,
  UpsertAeshProfilePayload,
} from "@/types/aesh-profile";

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

export async function getAeshProfile(): Promise<AeshProfileResponse> {
  return apiFetch<AeshProfileResponse>("/aesh/profile");
}

export async function saveAeshProfile(
  payload: UpsertAeshProfilePayload,
  exists: boolean
): Promise<{ profile: AeshProfile; message: string }> {
  return apiFetch<{ profile: AeshProfile; message: string }>("/aesh/profile", {
    method: exists ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getAeshDocuments(): Promise<AeshDocument[]> {
  const res = await apiFetch<{ documents: AeshDocument[] }>("/aesh/documents");
  return res.documents;
}

export async function uploadAeshDocument(
  type: DocumentType,
  file: File
): Promise<{ document: AeshDocument; message: string }> {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);

  return apiFetch<{ document: AeshDocument; message: string }>("/aesh/documents", {
    method: "POST",
    body: form,
  });
}

export async function deleteAeshDocument(id: number): Promise<void> {
  await apiFetch<void>(`/aesh/documents/${id}`, { method: "DELETE" });
}

export function aeshDocumentDownloadUrl(id: number): string {
  return `${API_URL}/api/aesh/documents/${id}/download`;
}
