import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { ListingMarketingClient } from "@/features/marketing/components/listing-marketing-client";

export const metadata: Metadata = {
  title: "Marketing do anúncio",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardListingMarketingPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <RequireAuth>
      <ListingMarketingClient listingId={id} />
    </RequireAuth>
  );
}
