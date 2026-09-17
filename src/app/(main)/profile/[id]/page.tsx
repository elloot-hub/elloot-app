import type { Metadata } from "next";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { Container } from "@/components/layout/container";
import { fetchSellerProfileData } from "@/features/seller/api";
import { SellerProfileClientView } from "@/features/seller/components/seller-profile-client";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const data = await fetchSellerProfileData(id);
    const handle = data.seller.username?.trim() || data.seller.name?.trim() || "Perfil";
    const rating = data.seller.stats?.ratingAvg;
    const ratingLabel = rating != null ? ` · ${rating.toFixed(1)}★` : "";
    return {
      title: `${handle}${ratingLabel} | Elloot`,
      description:
        data.seller.bio?.trim() ||
        `Perfil de ${handle} na Elloot — anúncios ativos, reputação e avaliações verificadas.`,
    };
  } catch (err) {
    unstable_rethrow(err);
    return {
      title: "Perfil | Elloot",
    };
  };
};

export default async function ProfilePage({ params }: Props) {
  const { id: param } = await params;

  let data;
  try {
    data = await fetchSellerProfileData(param);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  };

  const username = data.seller.username?.trim();
  if (username && param.toLowerCase() !== username.toLowerCase()) {
    redirect(routes.profile(username));
  };

  return (
    <Container className="py-8 sm:py-10">
      <SellerProfileClientView data={data} />
    </Container>
  );
};