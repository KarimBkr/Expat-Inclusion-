import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function csrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  });
}

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

export async function register(payload: RegisterPayload): Promise<{ user: User }> {
  await csrfCookie();
  return apiFetch<{ user: User }>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<{ user: User }> {
  await csrfCookie();
  return apiFetch<{ user: User }>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/logout", { method: "POST" });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/me");
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await csrfCookie();
  await apiFetch<void>("/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await csrfCookie();
  await apiFetch<void>("/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendVerificationEmail(): Promise<void> {
  await apiFetch<void>("/email/resend", { method: "POST" });
}
