import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { OrdersListClient } from "@/features/orders/components/orders-list-client";

export const metadata: Metadata = {
  title: "Pedidos",
};

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Container className="space-y-6 py-10 sm:py-12">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">
            Compras e vendas com escrow.
          </p>
        </div>
        <OrdersListClient />
      </Container>
    </RequireAuth>
  );
}
