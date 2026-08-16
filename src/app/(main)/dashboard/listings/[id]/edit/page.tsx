import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { SellPageContent } from "@/features/listings/components/sell-page-content";

export const metadata: Metadata = {
  title: "Editar anúncio",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardListingEditPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <RequireAuth>
      <SellPageContent mode="edit" listingId={id} />
    </RequireAuth>
  );
}
