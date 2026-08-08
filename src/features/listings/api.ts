import { api } from "@/lib/api/client";
import type {
  ListingDetail,
  ListingModel,
  ListingProductType,
} from "@/types/api";

export type CreateListingOfferInput = {
  title: string;
  priceCents: number;
  stockQuantity?: number;
};

export type CreateListingInput = {
  categoryId: string;
  title: string;
  description: string;
  priceCents?: number;
  stockQuantity?: number;
  productType?: ListingProductType | null;
  listingModel?: ListingModel;
  mediaUrls?: string[];
  publish?: boolean;
  offers?: CreateListingOfferInput[];
};

export async function fetchListing(id: string, token?: string | null) {
  return api.get<{ listing: ListingDetail }>(`/api/listings/${id}`, {
    auth: Boolean(token),
    token: token ?? null,
  });
}

export async function createListing(input: CreateListingInput) {
  return api.post<{ listing: ListingDetail; accessToken?: string }>(
    "/api/listings",
    input,
  );
}
