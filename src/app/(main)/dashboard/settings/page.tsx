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
        description="Dados da conta e preferências."
        breadcrumb={["Conta", "Configurações"]}
      >
        <SettingsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
