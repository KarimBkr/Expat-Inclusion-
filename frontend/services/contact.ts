const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ContactPayload = {
  name: string;
  email: string;
  role: string;
  subject: string;
  message: string;
};

function getXsrfToken(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  // The frontend origin is Sanctum-stateful, so the API demands a CSRF token even for guests.
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" });
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-XSRF-TOKEN": getXsrfToken(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    // Laravel's 422 message appends an English "(and N more errors)": show the first French field error.
    const firstError = data.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    throw new Error(firstError ?? data.message ?? "Une erreur est survenue. Veuillez réessayer.");
  }
}
