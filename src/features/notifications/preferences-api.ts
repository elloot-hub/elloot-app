import { api } from "@/lib/api/client";

export type NotificationCategory =
  | "MESSAGE"
  | "ORDER"
  | "DISPUTE"
  | "QUESTION"
  | "REVIEW"
  | "SYSTEM";

export type CategoryPreference = {
  category: NotificationCategory;
  inApp: boolean;
  push: boolean;
  inAppLocked: boolean;
};

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  MESSAGE: "Chats",
  ORDER: "Pedidos",
  DISPUTE: "Disputas",
  QUESTION: "Perguntas",
  REVIEW: "Avaliações",
  SYSTEM: "Sistema e anúncios",
};

export const CATEGORY_HINTS: Record<NotificationCategory, string> = {
  MESSAGE: "Novas mensagens no chat",
  ORDER: "Pagamento, entrega e confirmação",
  DISPUTE: "Abertura e resolução de tickets",
  QUESTION: "Perguntas e respostas em anúncios",
  REVIEW: "Novas avaliações recebidas",
  SYSTEM: "Moderação, saques e avisos da conta",
};

export async function fetchNotificationPreferences() {
  const res = await api.get<{ preferences: CategoryPreference[] }>(
    "/api/notifications/preferences",
  );
  return res.preferences;
}

export async function updateNotificationPreferences(
  preferences: Array<{
    category: NotificationCategory;
    inApp?: boolean;
    push?: boolean;
  }>,
) {
  const res = await api.patch<{ preferences: CategoryPreference[] }>(
    "/api/notifications/preferences",
    { preferences },
  );
  return res.preferences;
}

export async function fetchPushConfig() {
  return api.get<{ enabled: boolean; publicKey: string | null }>(
    "/api/notifications/push/config",
  );
}

export async function subscribePush(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  return api.post<{ subscription: { id: string; endpoint: string } }>(
    "/api/notifications/push/subscribe",
    input,
  );
}

export async function unsubscribePush(endpoint: string) {
  return api.post<{ ok: boolean }>("/api/notifications/push/unsubscribe", {
    endpoint,
  });
}
