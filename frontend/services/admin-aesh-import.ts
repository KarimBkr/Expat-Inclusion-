import type { AeshImportReport } from "@/types/aesh-import";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getXsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function importAeshCsv(file: File): Promise<AeshImportReport> {
  const body = new FormData();
  body.append("file", file);

  // Pas de Content-Type manuel : le navigateur fixe le boundary multipart lui-même.
  const res = await fetch(`${API_URL}/api/admin/aesh-import`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": getXsrfToken(),
    },
    body,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? "L'import a échoué.");
  }

  return data as AeshImportReport;
}
