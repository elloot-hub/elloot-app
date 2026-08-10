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
import type { PresenceUpdate } from "@/features/realtime/events";
import {
  connectRealtime,
  disconnectRealtime,
  getRealtimeSocket,
  type AppSocket,
} from "@/features/realtime/socket-client";
import { bindNotifySoundUnlock } from "@/features/notifications/notify-sound";

type PresenceMap = Record<
  string,
  { online: boolean; lastSeenAt: string | null }
>;

type RealtimeContextValue = {
  socket: AppSocket | null;
  connected: boolean;
  presence: PresenceMap;
  subscribePresence: (userIds: string[]) => void;
  unsubscribePresence: (userIds: string[]) => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<PresenceMap>({});

  useEffect(() => {
    bindNotifySoundUnlock();
  }, []);

  useEffect(() => {
    if (!token) {
      disconnectRealtime();
      setSocket(null);
      setConnected(false);
      setPresence({});
      return;
    }

    const next = connectRealtime(token);
    setSocket(next);

    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onPresence(payload: PresenceUpdate) {
      setPresence((prev) => ({
        ...prev,
        [payload.userId]: {
          online: payload.online,
          lastSeenAt: payload.lastSeenAt,
        },
      }));
    }

    next.on("connect", onConnect);
    next.on("disconnect", onDisconnect);
    next.on("presence:update", onPresence);
    if (next.connected) setConnected(true);

    return () => {
      next.off("connect", onConnect);
      next.off("disconnect", onDisconnect);
      next.off("presence:update", onPresence);
    };
  }, [token]);

  const subscribePresence = useCallback((userIds: string[]) => {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return;
    getRealtimeSocket()?.emit("presence:subscribe", { userIds: ids });
  }, []);

  const unsubscribePresence = useCallback((userIds: string[]) => {
    const ids = [...new Set(userIds.filter(Boolean))];
    if (ids.length === 0) return;
    getRealtimeSocket()?.emit("presence:unsubscribe", { userIds: ids });
  }, []);

  const value = useMemo(
    () => ({
      socket,
      connected,
      presence,
      subscribePresence,
      unsubscribePresence,
    }),
    [socket, connected, presence, subscribePresence, unsubscribePresence],
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return ctx;
}

export function usePresence(userId: string | null | undefined) {
  const { presence, subscribePresence, unsubscribePresence, connected } =
    useRealtime();

  useEffect(() => {
    if (!userId || !connected) return;
    subscribePresence([userId]);
    return () => unsubscribePresence([userId]);
  }, [userId, connected, subscribePresence, unsubscribePresence]);

  if (!userId) {
    return { online: false, lastSeenAt: null as string | null };
  }
  return (
    presence[userId] ?? { online: false, lastSeenAt: null as string | null }
  );
}
