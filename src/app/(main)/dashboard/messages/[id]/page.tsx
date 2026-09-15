import type { Metadata } from "next";
import { ConversationThreadClient } from "@/features/conversations/components/conversation-thread-client";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Conversa",
};

export default async function DashboardConversationPage({ params }: Props) {
  const { id } = await params;
  return <ConversationThreadClient conversationId={id} embedded />;
};