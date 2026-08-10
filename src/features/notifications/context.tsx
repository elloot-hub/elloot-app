"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/context";
import {
  fetchMyNotifications,
  markAllNotificationsRead as apiMarkAll,
  markNotificationRead as apiMarkRead,
  type AppNotification,
} from "@/features/notifications/api";
import { useRealtime } from "@/features/realtime";
import type { RealtimeNotification } from "@/features/realtime/events";
import {
  bindNotifySoundUnlock,
  playNotifySound,
} from "@/features/notifications/notify-sound";

type NotificationsContextValue = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { socket } = useRealtime();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { notifications } = await fetchMyNotifications();
      setItems(notifications);
    } catch {
      // Keep previous list on transient errors.
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    bindNotifySoundUnlock();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;
    function onNew(payload: RealtimeNotification) {
      setItems((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        playNotifySound();
        return [{ ...payload, read: Boolean(payload.readAt) }, ...prev];
      });
    }
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [socket]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, read: true, readAt: n.readAt ?? new Date().toISOString() }
          : n,
      ),
    );
    try {
      await apiMarkRead(id);
    } catch {
      // Optimistic UI; next refresh corrects.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: n.readAt ?? now })),
    );
    try {
      await apiMarkAll();
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, loading, refresh, markRead, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
