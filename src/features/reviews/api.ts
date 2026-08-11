import { api } from "@/lib/api/client";

export type ReviewSummary = {
  ratingCount: number;
  ratingAvg: number | null;
  stars: Record<1 | 2 | 3 | 4 | 5, number> | { [k: number]: number };
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercent: number | null;
};

export type ListingReview = {
  id: string;
  orderId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyer: { id: string; name: string | null; avatarUrl?: string | null };
  listing?: {
    id: string;
    title: string;
    media?: Array<{ url: string }>;
  };
};

export async function fetchListingReviews(
  listingId: string,
  opts?: { cursor?: string; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.cursor) params.set("cursor", opts.cursor);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return api.get<{
    reviews: ListingReview[];
    summary: ReviewSummary;
    nextCursor: string | null;
  }>(`/api/reviews/by-listing/${listingId}${qs ? `?${qs}` : ""}`, {
    auth: false,
  });
}

export async function createReview(input: {
  orderId: string;
  rating: number;
  comment?: string;
}) {
  return api.post<{ review: ListingReview }>("/api/reviews", input);
}

export async function fetchMyReviews() {
  return api.get<{ reviews: ListingReview[] }>("/api/reviews/mine");
}

export async function fetchReceivedReviews() {
  return api.get<{ reviews: ListingReview[]; summary: ReviewSummary }>(
    "/api/reviews/received",
  );
}
