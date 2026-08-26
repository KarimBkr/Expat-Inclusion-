import type { AppNotification, NotificationListResponse } from "@/types/notification";

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
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export async function listNotifications(): Promise<NotificationList> {
  const res = await apiFetch<NotificationListResponse>("/notifications");
  return { items: res.data.data, unreadCount: res.unread_count };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<void>(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<void>("/notifications/read-all", { method: "POST" });
}
