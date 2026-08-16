import { api } from "@/lib/api/client";
import type { RealtimeNotification } from "@/features/realtime/events";

export type AppNotification = RealtimeNotification & {
  /** UI convenience — derived from readAt */
  read: boolean;
};

function toApp(n: RealtimeNotification): AppNotification {
  return { ...n, read: Boolean(n.readAt) };
}

export async function fetchMyNotifications(opts?: {
  cursor?: string;
  take?: number;
}) {
  const params = new URLSearchParams();
  if (opts?.cursor) params.set("cursor", opts.cursor);
  if (opts?.take) params.set("take", String(opts.take));
  const qs = params.toString();
  const res = await api.get<{
    notifications: RealtimeNotification[];
    nextCursor: string | null;
  }>(`/api/notifications/mine${qs ? `?${qs}` : ""}`);
  return {
    notifications: res.notifications.map(toApp),
    nextCursor: res.nextCursor ?? null,
  };
}

export async function fetchUnreadNotificationCount() {
  const res = await api.get<{ unreadCount: number }>(
    "/api/notifications/mine/unread-count",
  );
  return res.unreadCount;
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
