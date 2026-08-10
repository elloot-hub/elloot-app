import { api } from "@/lib/api/client";

export type ConversationSummary = {
  id: string;
  orderId: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    status: string;
    amountCents: number;
    buyerId: string;
    sellerId: string;
    listing: { id: string; title: string };
    buyer: { id: string; name: string | null };
    seller: { id: string; name: string | null };
  };
  messages?: Array<{
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  }>;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientId?: string | null;
  readAt?: string | null;
  createdAt: string;
  sender?: { id: string; name: string | null };
};

export async function fetchConversations() {
  return api.get<{ conversations: ConversationSummary[] }>(
    "/api/conversations",
  );
}

export async function fetchConversation(id: string) {
  return api.get<{ conversation: ConversationSummary }>(
    `/api/conversations/${id}`,
  );
}

export async function fetchConversationByOrder(orderId: string) {
  return api.get<{ conversation: ConversationSummary }>(
    `/api/conversations/by-order/${orderId}`,
  );
}

export async function fetchConversationMessages(
  conversationId: string,
  opts?: { after?: string; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.after) params.set("after", opts.after);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return api.get<{ messages: ConversationMessage[]; nextCursor: string | null }>(
    `/api/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
  );
}

export async function sendConversationMessage(
  conversationId: string,
  body: string,
  opts?: { clientId?: string },
) {
  return api.post<{ message: ConversationMessage }>(
    `/api/conversations/${conversationId}/messages`,
    { body, clientId: opts?.clientId },
  );
}
