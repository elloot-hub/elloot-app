import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { OrderDetailClient } from "@/features/orders/components/order-detail-client";

export const metadata: Metadata = {
  title: "Pedido",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  return (
    <RequireAuth>
      <Container className="py-10 sm:py-12">
        <OrderDetailClient orderId={id} />
      </Container>
    </RequireAuth>
  );
}
