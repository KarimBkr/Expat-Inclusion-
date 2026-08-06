import type { AeshDetail } from "@/types/aesh-detail";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getAeshDetail(id: number): Promise<AeshDetail> {
  const res = await fetch(`${API_URL}/api/parent/aesh-profiles/${id}`, {
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

  return (data as { data: AeshDetail }).data;
}
