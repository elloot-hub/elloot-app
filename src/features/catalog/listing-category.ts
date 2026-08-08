import type { ListingCategoryRef } from "@/types/api";

/** Primary vertical label for a listing (parent category, or itself if root-level). */
export function listingVertical(category: ListingCategoryRef) {
  return category.parent ?? category;
}
