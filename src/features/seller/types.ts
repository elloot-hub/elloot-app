import type { ListingProductType, ListingSummary, SellerPublic } from "@/types/api";

export type SellerClassFilter = "ALL" | ListingProductType;

export type ProfileReviewItem = {
  id: string;
  buyerName: string | null;
  buyerUsername?: string | null;
  buyerAvatar?: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  productTitle: string;
  productType: ListingProductType;
  orderCode: string;
};

/** @deprecated Use ProfileReviewItem — kept for transitional imports. */
export type HourlyReviewItem = ProfileReviewItem & {
  timeAgo?: string;
};

export type SellerProfileStats = {
  totalSales: number;
  deliveredCount: number;
  undeliveredCount: number;
  deliveryRatePercent: number;
  avgDeliveryMinutes?: number | null;
  avgDeliveryTime: string;
  reviewsPerHour: number;
  reviewsLast24h: number;
  positivePercent: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
};

export type SellerProfileData = {
  seller: SellerPublic;
  stats: SellerProfileStats;
  listings: ListingSummary[];
  reviews: ProfileReviewItem[];
  /** @deprecated alias of reviews */
  hourlyReviews?: ProfileReviewItem[];
};
