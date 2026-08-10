import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { NotificationsListClient } from "@/features/notifications/components/notifications-list-client";

export const metadata: Metadata = {
  title: "Notificações",
};

export default function DashboardNotificationsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Notificações"
        description="Alertas de pedidos, mensagens e conta em tempo real."
        breadcrumb={["Conta", "Visão geral", "Notificações"]}
      >
        <NotificationsListClient />
      </DashboardShell>
    </RequireAuth>
  );
}
