import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { SalesDeliveryClient } from "@/features/dashboard/components/sales-delivery-client";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export const metadata: Metadata = {
  title: "Vendas e entrega",
};

export default function DashboardSalesPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Minhas vendas"
        description="Pedidos em que você é o vendedor — filtre, entregue e acompanhe o escrow."
      >
        <SalesDeliveryClient />
      </DashboardShell>
    </RequireAuth>
  );
}
