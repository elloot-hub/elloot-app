import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { fetchSellerProfileData } from "@/features/seller/api";
import { SellerProfileClientView } from "@/features/seller/components/seller-profile-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await fetchSellerProfileData(id);
    const sellerName = data.seller.name?.trim() || "Vendedor";
    return {
      title: `Perfil de ${sellerName} — Vendedor Verificado | elLoot Marketplace`,
      description: `Confira os anúncios à venda de ${sellerName}, estatísticas de vendas, taxa de entrega de ${data.stats.deliveryRatePercent}% e avaliações recentes.`,
    };
  } catch {
    return {
      title: "Perfil do Vendedor | elLoot Marketplace",
    };
  }
}

export default async function SellerProfilePage({ params }: Props) {
  const { id } = await params;
  const data = await fetchSellerProfileData(id);

  return (
    <Container className="py-8 sm:py-10">
      <SellerProfileClientView data={data} />
    </Container>
  );
}
