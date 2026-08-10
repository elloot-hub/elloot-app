import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ConversationsListClient } from "@/features/conversations/components/conversations-list-client";

export const metadata: Metadata = {
  title: "Mensagens",
};

export default function DashboardMessagesPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Mensagens"
        description="Conversas dos pedidos. Abra um thread para enviar mensagens (atualiza automaticamente)."
        breadcrumb={["Conta", "Compras", "Mensagens"]}
      >
        <ConversationsListClient />
      </DashboardShell>
    </RequireAuth>
  );
}
