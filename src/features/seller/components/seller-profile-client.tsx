"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { SellerProfileData } from "../types";
import { SellerHeader } from "./seller-header";
import { SellerReputationBar } from "./seller-reputation-bar";
import { SellerProfileSidebar } from "./seller-profile-sidebar";
import { SellerClassListings } from "./seller-class-listings";
import { SellerReviewsFeed } from "./seller-hourly-reviews";
import { routes } from "@/lib/routes";

type Props = {
  data: SellerProfileData;
};

export function SellerProfileClientView({ data }: Props) {
  const { seller, stats, listings, reviews } = data;
  const handle =
    seller.username?.trim() || seller.name?.trim() || "perfil";
  const sellerName = seller.name?.trim() || handle;
  const ratingAvg = seller.stats?.ratingAvg ?? 0;
  const ratingCount = seller.stats?.ratingCount ?? 0;
  const reviewItems = reviews ?? [];

  return (
    <div className="space-y-6 pb-12">
      <SellerHeader seller={seller} totalListingsCount={listings.length} />

      {/* <SellerReputationBar stats={stats} /> */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <SellerReviewsFeed
            reviews={reviewItems}
            sellerName={sellerName}
            ratingAvg={ratingAvg}
            ratingCount={ratingCount}
            reviewsPerHour={stats.reviewsPerHour}
            reviewsLast24h={stats.reviewsLast24h}
          />

          <div id="anuncios">
            <SellerClassListings listings={listings} sellerName={sellerName} />
          </div>
        </div>

        <SellerProfileSidebar seller={seller} stats={stats} listingsCount={listings.length} />
      </div>
    </div>
  )
}