import type { AeshSearchResult, PaginatedResponse, SearchFilters } from "@/types/aesh-search";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function searchAesh(
  filters: SearchFilters,
  page = 1
): Promise<PaginatedResponse<AeshSearchResult>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set("page", String(page));

  const res = await fetch(`${API_URL}/api/parent/aesh-search?${params.toString()}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(
      (data as { message?: string }).message ?? "Une erreur est survenue."
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as PaginatedResponse<AeshSearchResult>;
}
