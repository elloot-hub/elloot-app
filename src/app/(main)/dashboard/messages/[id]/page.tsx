import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { ConversationThreadClient } from "@/features/conversations/components/conversation-thread-client";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Conversa",
};

export default async function DashboardConversationPage({ params }: Props) {
  const { id } = await params;

  return (
    <RequireAuth>
      <DashboardShell
        title="Conversa"
        layout="chat"
        breadcrumb={["Conta", "Compras", "Mensagens", "Conversa"]}
      >
        <ConversationThreadClient conversationId={id} />
      </DashboardShell>
    </RequireAuth>
  );
}
