import { api } from "@/lib/api/client";
import type {
  DeliveryMode,
  ListingDetail,
  ListingModel,
  ListingProductType,
} from "@/types/api";

export type CreateListingOfferInput = {
  title: string;
  priceCents: number;
  stockQuantity?: number;
  deliveryMode?: DeliveryMode;
  autoStockLines?: string[];
};

export type CreateListingInput = {
  categoryId: string;
  title: string;
  description: string;
  priceCents?: number;
  stockQuantity?: number;
  productType?: ListingProductType | null;
  listingModel?: ListingModel;
  deliveryMode?: DeliveryMode;
  autoStockLines?: string[];
  /** Preferred: ids returned by uploadMedia (purpose LISTING). */
  mediaAssetIds?: string[];
  /** @deprecated Prefer mediaAssetIds. */
  mediaUrls?: string[];
  publish?: boolean;
  offers?: CreateListingOfferInput[];
  reachPlanId?: string;
};

export async function fetchListing(id: string, token?: string | null) {
  return api.get<{ listing: ListingDetail }>(`/api/listings/${id}`, {
    auth: Boolean(token),
    token: token ?? null,
  });
}

export async function createListing(input: CreateListingInput) {
  return api.post<{
    listing: ListingDetail;
    accessToken?: string;
    moderation?: { status: string; message: string } | null;
  }>("/api/listings", input);
}

export type UpdateListingOfferInput = CreateListingOfferInput & {
  id?: string;
};

export type UpdateListingInput = {
  categoryId?: string;
  title?: string;
  description?: string;
  priceCents?: number;
  stockQuantity?: number;
  productType?: ListingProductType | null;
  deliveryMode?: DeliveryMode;
  autoStockLines?: string[];
  mediaAssetIds?: string[];
  mediaUrls?: string[];
  offers?: UpdateListingOfferInput[];
  reachPlanId?: string;
};

export async function updateListing(id: string, input: UpdateListingInput) {
  return api.patch<{
    listing: ListingDetail;
    moderation?: {
      appliedImmediately: string[];
      pendingRevision: {
        id: string;
        changedFields: string[];
        message: string;
      } | null;
    };
  }>(`/api/listings/${id}`, input);
}

export type UpdateListingStockInput = {
  offerId?: string;
  stockQuantity?: number;
  appendLines?: string[];
  removeItemIds?: string[];
  replaceLines?: string[];
};

export async function updateListingStock(
  id: string,
  input: UpdateListingStockInput,
) {
  return api.patch<{ listing: ListingDetail }>(
    `/api/listings/${id}/stock`,
    input,
  );
}

export async function publishListing(id: string) {
  return api.post<{ listing: ListingDetail }>(`/api/listings/${id}/publish`);
}

export async function pauseListing(id: string) {
  return api.post<{ listing: ListingDetail }>(`/api/listings/${id}/pause`);
}

export async function unpauseListing(id: string) {
  return api.post<{ listing: ListingDetail }>(`/api/listings/${id}/unpause`);
}

export async function reorderListingOffers(id: string, offerIds: string[]) {
  return api.patch<{ listing: ListingDetail }>(
    `/api/listings/${id}/offers/reorder`,
    { offerIds },
  );
}

export async function deleteListing(id: string) {
  return api.delete<{ listing: ListingDetail }>(`/api/listings/${id}`);
}

export async function fetchMyListings() {
  return api.get<{ listings: ListingDetail[] }>("/api/listings/mine");
}
