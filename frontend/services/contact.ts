const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ContactPayload = {
  name: string;
  email: string;
  role: string;
  subject: string;
  message: string;
};

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ?? "Une erreur est survenue. Veuillez réessayer."
    );
  }
}
