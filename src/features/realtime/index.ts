/**
 * Realtime feature — Socket.IO (chat, presença, notificações push).
 */

export { RealtimeProvider, useRealtime, usePresence } from "./realtime-provider";
export { getRealtimeSocket, connectRealtime, disconnectRealtime } from "./socket-client";
export type {
  PresenceUpdate,
  RealtimeMessageEvent,
  RealtimeNotification,
} from "./events";
