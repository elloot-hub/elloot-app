import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { fetchListing } from "@/features/listings/api";
import { ListingDetailView } from "@/features/listings/components/listing-detail";
import { ApiError } from "@/lib/api/errors";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { listing } = await fetchListing(id);
    return { title: listing.title };
  } catch {
    return { title: "Anúncio" };
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;

  try {
    const { listing } = await fetchListing(id);
    return (
      <Container className="py-10 sm:py-12">
        <ListingDetailView listing={listing} />
      </Container>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
