import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { NotificationsListClient } from "@/features/notifications/components/notifications-list-client";

export const metadata: Metadata = {
  title: "Central de notificações",
};

export default function DashboardNotificationsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Central de notificações"
        description="Veja e gerencie as notificações da sua conta."
      >
        <NotificationsListClient />
      </DashboardShell>
    </RequireAuth>
  );
}
