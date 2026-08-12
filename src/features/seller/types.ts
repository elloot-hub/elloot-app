import type { ListingProductType, ListingSummary, SellerPublic } from "@/types/api";

export type SellerClassFilter = "ALL" | ListingProductType;

export type HourlyReviewItem = {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number; // 1-5
  comment: string;
  timeAgo: string; // e.g. "Há 12 min", "Há 45 min", "Há 1 hora"
  productTitle: string;
  productType: ListingProductType;
  orderCode: string;
};

export type SellerProfileStats = {
  totalSales: number;
  deliveredCount: number;
  undeliveredCount: number;
  deliveryRatePercent: number;
  avgDeliveryTime: string; // e.g. "7 minutos"
  reviewsPerHour: number; // e.g. 4.8
  reviewsLast24h: number; // e.g. 115
  positivePercent: number; // e.g. 99.4
};

export type SellerProfileData = {
  seller: SellerPublic;
  stats: SellerProfileStats;
  listings: ListingSummary[];
  hourlyReviews: HourlyReviewItem[];
};
