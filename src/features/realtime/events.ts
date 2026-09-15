import type { ConversationMessage } from "@/features/conversations/api";

export type PresenceUpdate = {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
};

export type RealtimeMessageEvent = {
  conversationId: string;
  message: ConversationMessage;
};

export type RealtimeNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  meta?: unknown;
};

export type RealtimeConversationReadEvent = {
  conversationId: string;
  readerId: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  buyerLastReadAt: string | null;
  sellerLastReadAt: string | null;
  adminLastReadAt: string | null;
};

export type ServerToClientEvents = {
  "presence:update": (payload: PresenceUpdate) => void;
  "message:new": (payload: RealtimeMessageEvent) => void;
  "conversation:read": (payload: RealtimeConversationReadEvent) => void;
  "notification:new": (payload: RealtimeNotification) => void;
};

export type ClientToServerEvents = {
  "conversation:join": (
    payload: { conversationId: string },
    ack?: (res: { ok: boolean; error?: string }) => void,
  ) => void;
  "conversation:leave": (payload: { conversationId: string }) => void;
  "presence:subscribe": (payload: { userIds: string[] }) => void;
  "presence:unsubscribe": (payload: { userIds: string[] }) => void;
  "message:send": (
    payload: { conversationId: string; body: string; clientId?: string },
    ack?: (res: {
      ok: boolean;
      message?: ConversationMessage;
      error?: string;
    }) => void,
  ) => void;
};
