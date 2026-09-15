import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { PurchasesClient } from "@/features/dashboard/components/purchases-client";

export const metadata: Metadata = {
  title: "Minhas compras",
};

export default function DashboardPurchasesPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Minhas compras"
        description="Acompanhe seus pedidos e o status de cada compra."
      >
        <PurchasesClient />
      </DashboardShell>
    </RequireAuth>
  );
}
