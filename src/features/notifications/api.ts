import { api } from "@/lib/api/client";
import type { RealtimeNotification } from "@/features/realtime/events";

export type AppNotification = RealtimeNotification & {
  /** UI convenience — derived from readAt */
  read: boolean;
};

function toApp(n: RealtimeNotification): AppNotification {
  return { ...n, read: Boolean(n.readAt) };
}

export async function fetchMyNotifications() {
  const res = await api.get<{ notifications: RealtimeNotification[] }>(
    "/api/notifications/mine",
  );
  return { notifications: res.notifications.map(toApp) };
}

export async function markNotificationRead(id: string) {
  const res = await api.post<{ notification: RealtimeNotification }>(
    `/api/notifications/${id}/read`,
  );
  return toApp(res.notification);
}

export async function markAllNotificationsRead() {
  return api.post<{ ok: boolean }>("/api/notifications/mine/read-all");
}
