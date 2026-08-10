/**
 * Conversations feature — chat do pedido (escrow / entrega).
 *
 * STATUS: inbox + thread com Socket.IO (fallback REST).
 */

export {
  fetchConversations,
  fetchConversation,
  fetchConversationByOrder,
  fetchConversationMessages,
  sendConversationMessage,
} from "./api";
export type { ConversationSummary, ConversationMessage } from "./api";
export { ConversationsListClient } from "./components/conversations-list-client";
export { ConversationThreadClient } from "./components/conversation-thread-client";
