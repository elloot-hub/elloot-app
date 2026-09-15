import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { SettingsClient } from "@/features/dashboard/components/settings-client";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function DashboardSettingsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Configurações"
        description="Perfil, PIX, notificações e preferências da conta."
      >
        <SettingsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
