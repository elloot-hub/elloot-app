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
  fetchUnreadNotificationCount,
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
  loadingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setNextCursor(null);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ notifications, nextCursor: cursor }, count] = await Promise.all([
        fetchMyNotifications({ take: 40 }),
        fetchUnreadNotificationCount(),
      ]);
      setItems(notifications);
      setNextCursor(cursor);
      setUnreadCount(count);
    } catch {
      // Keep previous list on transient errors.
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadMore = useCallback(async () => {
    if (!token || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { notifications, nextCursor: cursor } = await fetchMyNotifications({
        cursor: nextCursor,
        take: 40,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...notifications.filter((n) => !seen.has(n.id))];
      });
      setNextCursor(cursor);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [token, nextCursor, loadingMore]);

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
      if (!payload.readAt) {
        setUnreadCount((c) => c + 1);
      }
    }
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [socket]);

  const markRead = useCallback(async (id: string) => {
    let becameRead = false;
    setItems((prev) =>
      prev.map((n) => {
        if (n.id !== id || n.read) return n;
        becameRead = true;
        return {
          ...n,
          read: true,
          readAt: n.readAt ?? new Date().toISOString(),
        };
      }),
    );
    if (becameRead) setUnreadCount((c) => Math.max(0, c - 1));
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
    setUnreadCount(0);
    try {
      await apiMarkAll();
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      loadingMore,
      hasMore: Boolean(nextCursor),
      refresh,
      loadMore,
      markRead,
      markAllRead,
    }),
    [
      items,
      unreadCount,
      loading,
      loadingMore,
      nextCursor,
      refresh,
      loadMore,
      markRead,
      markAllRead,
    ],
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
