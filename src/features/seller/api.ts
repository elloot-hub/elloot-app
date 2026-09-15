import { api } from "@/lib/api/client";
import type { ListingProductType, ListingSummary, SellerPublic } from "@/types/api";
import { ApiError } from "@/lib/api/errors";
import type {
  ProfileReviewItem,
  SellerProfileData,
  SellerProfileStats,
} from "./types";

type ProfileApiResponse = {
  seller: SellerPublic;
  stats: SellerProfileStats;
  listings: ListingSummary[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    buyerName: string | null;
    buyerUsername?: string | null;
    buyerAvatar: string | null;
    productTitle: string;
    productType: ListingProductType | null;
    orderCode: string;
  }>;
};

function isApiError(err: unknown): err is ApiError {
  if (err instanceof ApiError) return true;
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: unknown; status?: unknown; code?: unknown; message?: unknown };
  return (
    e.name === "ApiError" &&
    typeof e.status === "number" &&
    typeof e.code === "string" &&
    typeof e.message === "string"
  );
}

export async function fetchSellerProfileData(
  sellerId: string,
): Promise<SellerProfileData> {
  try {
    const data = await api.get<ProfileApiResponse>(
      `/api/profiles/${encodeURIComponent(sellerId)}`,
      { auth: false },
    );

    if (!data?.seller || !data.stats) {
      throw new ApiError(
        502,
        "PROFILE_INVALID_PAYLOAD",
        "Resposta inválida ao carregar o perfil.",
      );
    }

    const reviews: ProfileReviewItem[] = (data.reviews ?? []).map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
      buyerName: row.buyerName,
      buyerUsername: row.buyerUsername,
      buyerAvatar: row.buyerAvatar,
      productTitle: row.productTitle,
      productType: row.productType ?? "OUTROS",
      orderCode: row.orderCode,
    }));

    return {
      seller: data.seller,
      stats: {
        ...data.stats,
        positiveCount: data.stats.positiveCount ?? 0,
        neutralCount: data.stats.neutralCount ?? 0,
        negativeCount: data.stats.negativeCount ?? 0,
      },
      listings: data.listings ?? [],
      reviews,
      hourlyReviews: reviews,
    };
  } catch (err) {
    if (isApiError(err)) throw err;

    const message =
      err instanceof Error && err.message
        ? err.message
        : "Não foi possível carregar o perfil.";
    throw new ApiError(500, "PROFILE_LOAD_FAILED", message);
  }
}
