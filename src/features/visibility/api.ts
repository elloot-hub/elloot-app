import { api } from "@/lib/api/client";

export type VisibilityProductPublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationHours: number;
  scope: "GLOBAL" | "CATEGORY";
  categoryId: string | null;
  category: { id: string; name: string; slugPath: string } | null;
  maxActiveSlots: number | null;
  queueEnabled?: boolean;
  priority: number;
  badgeLabel: string | null;
  active: boolean;
  sortOrder: number;
  slotsUsed?: number;
  queuedCount?: number;
  slotsAvailable?: number | null;
  fillRate?: number | null;
};

export type ListingPlacement = {
  id: string;
  listingId: string;
  productId: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  paidCents?: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  product?: VisibilityProductPublic;
};

export async function fetchVisibilityProducts() {
  return api.get<{ products: VisibilityProductPublic[] }>(
    "/api/visibility/products",
    { auth: false },
  );
}

export async function fetchListingPlacements(listingId: string) {
  return api.get<{ placements: ListingPlacement[] }>(
    `/api/visibility/listings/${listingId}/placements`,
  );
}

export async function purchaseListingVisibility(
  listingId: string,
  productId: string,
) {
  return api.post<{
    placement: ListingPlacement;
    extended: boolean;
    queued: boolean;
    balanceCents: number;
  }>(`/api/visibility/listings/${listingId}/purchase`, {
    productId,
    method: "wallet",
  });
}
