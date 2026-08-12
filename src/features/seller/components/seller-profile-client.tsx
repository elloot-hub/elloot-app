"use client";

import Link from "next/link";
import { ChevronRightIcon, StoreIcon } from "lucide-react";
import type { SellerProfileData } from "../types";
import { SellerHeader } from "./seller-header";
import { SellerStatsGrid } from "./seller-stats-grid";
import { SellerClassListings } from "./seller-class-listings";
import { SellerHourlyReviews } from "./seller-hourly-reviews";
import { routes } from "@/lib/routes";

type Props = {
  data: SellerProfileData;
};

export function SellerProfileClientView({ data }: Props) {
  const { seller, stats, listings, hourlyReviews } = data;
  const sellerName = seller.name?.trim() || "Vendedor GGMAX";
  const ratingAvg = seller.stats?.ratingAvg ?? 4.9;
  const ratingCount = seller.stats?.ratingCount ?? 184;

  return (
    <div className="select-none space-y-8 pb-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href={routes.home}
          className="transition-colors hover:text-foreground"
        >
          Início
        </Link>
        <ChevronRightIcon className="size-3 opacity-60" />
        <Link
          href={routes.market}
          className="transition-colors hover:text-foreground"
        >
          Mercado
        </Link>
        <ChevronRightIcon className="size-3 opacity-60" />
        <span className="flex items-center gap-1 font-medium text-foreground">
          <StoreIcon className="size-3.5 text-primary" />
          Perfil de {sellerName}
        </span>
      </nav>

      {/* Seller Header Card */}
      <SellerHeader seller={seller} totalListingsCount={listings.length} />

      {/* Seller Metrics & Performance Grid */}
      <SellerStatsGrid stats={stats} />

      {/* Catalog Items grouped & filtered by Class */}
      <SellerClassListings listings={listings} sellerName={sellerName} />

      {/* Hourly Review Stream */}
      <SellerHourlyReviews
        reviews={hourlyReviews}
        sellerName={sellerName}
        ratingAvg={ratingAvg}
        ratingCount={ratingCount}
        reviewsPerHour={stats.reviewsPerHour}
      />
    </div>
  );
}
