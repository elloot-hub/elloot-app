"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon, PackageIcon } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { listingVertical } from "@/features/catalog/listing-category";
import { marketCategoryHref } from "@/features/catalog/market-path";
import { ListingBuyPanel } from "@/features/listings/components/listing-buy-panel";
import { ExpandableDescription } from "@/features/listings/components/expandable-description";
import { ListingImageSlider } from "@/features/listings/components/listing-image-slider";
import { ListingQuestionsSection } from "@/features/listings/components/listing-questions-section";
import { ListingReviewsSection } from "@/features/listings/components/listing-reviews-section";
import { ListingSellerCard } from "@/features/listings/components/listing-seller-card";
import { trackListingEvent } from "@/features/listings/track-listing-event";
import { routes } from "@/lib/routes";
import type { ListingDetail as ListingDetailType, ListingProductType, } from "@/types/api";

type Props = {
  listing: ListingDetailType;
};

const PRODUCT_TYPE_LABEL: Record<ListingProductType, string> = {
  CONTA: "Conta",
  ITEM: "Item",
  SERVICO: "Serviço",
  GOLD: "Moeda / gold",
  OUTROS: "Outros",
};

function formatPublishedAt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ListingDetailView({ listing }: Props) {
  const media = useMemo(
    () =>
      [...listing.media].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
      ),
    [listing.media],
  );

  useEffect(() => {
    if (listing.status !== "ACTIVE") return;
    void trackListingEvent(listing.id, "VIEW");
  }, [listing.id, listing.status]);

  const vertical = listingVertical(listing.category);
  const visual = getCategoryVisual(vertical.slug);
  const isAuto = listing.deliveryMode === "AUTO";
  const isDynamic = listing.listingModel === "DYNAMIC";
  const categoryTrail = listing.category.parent ? [listing.category.parent, listing.category] : [listing.category];

  const stockTotal = isDynamic ? (listing.offers ?? []).reduce((sum, o) => sum + o.stockQuantity, 0) : listing.stockQuantity;
  const unitsSold = listing.unitsSold ?? 0;
  const salesCount = listing.salesCount ?? 0;
  const productLabel = listing.productType ? PRODUCT_TYPE_LABEL[listing.productType] : "—";

  const gallery = (
    <ListingImageSlider
      media={media}
      fallback={{ gradient: visual.gradient, label: vertical.name }}
    />
  );

  const titleBlock = (
    <div className="space-y-2">
      <h1 className="min-w-0 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
        {listing.title}
      </h1>
    </div>
  );

  const buyPanel = <ListingBuyPanel listing={listing} />;
  const sellerCard = <ListingSellerCard seller={listing.seller} />;

  const description = (
    <section className="space-y-3 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Descrição</h2>
        <p className="text-sm text-muted-foreground">
          Detalhes informados pelo vendedor.
        </p>
      </div>
      <div className="rounded-md border border-border/50 bg-background/60 p-4 sm:p-5">
        <ExpandableDescription text={listing.description} />
      </div>
    </section>
  );

  const metrics = (
    <div className="grid grid-cols-3 gap-2">
      <Metric
        label="Disponíveis"
        value={stockTotal > 50 ? "+50" : String(stockTotal)}
      />
      <Metric label="Vendidos" value={String(unitsSold)} />
      <Metric label="Vendas" value={String(salesCount)} />
    </div>
  );

  const details = (
    <section className="space-y-3 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Detalhes</h2>
        <p className="text-sm text-muted-foreground">
          Informações técnicas do anúncio.
        </p>
      </div>
      <dl className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/50">
        <DetailRow label="Categoria" value={vertical.name} />
        <DetailRow label="Subcategoria" value={listing.category.name} />
        <DetailRow label="Tipo" value={productLabel} />
        <DetailRow
          label="Forma de entrega"
          value={
            <span className="inline-flex items-center gap-1.5">
              {isAuto ? (
                <FaTruckFast className="size-3.5 text-emerald-400" />
              ) : (
                <PackageIcon className="size-3.5 text-muted-foreground" />
              )}
              {isAuto ? "Entrega automática" : "Entrega manual"}
            </span>
          }
        />
        <DetailRow
          label="Modelo"
          value={isDynamic ? "Anúncio dinâmico" : "Anúncio simples"}
        />
        <DetailRow label="Estoque" value={String(stockTotal)} />
        <DetailRow
          label="Publicado em"
          value={formatPublishedAt(listing.createdAt)}
        />
      </dl>
    </section>
  );

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={routes.market}
          className="transition-colors hover:text-foreground"
        >
          Mercado
        </Link>
        {categoryTrail.map((node) => (
          <span key={node.id} className="inline-flex items-center gap-1.5">
            <ChevronRightIcon className="size-3 opacity-60" />
            <Link
              href={marketCategoryHref(node)}
              className="transition-colors hover:text-foreground"
            >
              {node.name}
            </Link>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <ChevronRightIcon className="size-3 opacity-60" />
          <span className="max-w-[16rem] truncate text-foreground/80">
            {listing.title}
          </span>
        </span>
      </nav>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start lg:gap-10">
        <div className="contents lg:flex lg:flex-col lg:gap-4">
          <div className="order-1 lg:order-none">{gallery}</div>
          <div className="order-2 lg:order-none">{titleBlock}</div>
          <div className="order-5 lg:order-none">{description}</div>
          <div className="order-8 lg:order-none">
            <ListingReviewsSection listingId={listing.id} />
          </div>
          <div className="order-9 lg:order-none">
            <ListingQuestionsSection
              listingId={listing.id}
              sellerId={listing.seller.id}
            />
          </div>
        </div>

        <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-4">
          <div className="order-4 lg:order-none">{sellerCard}</div>
          <div className="order-3 lg:order-none">{buyPanel}</div>
          <div className="order-6 lg:order-none">{metrics}</div>
          <div className="order-7 lg:order-none">{details}</div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-3 py-3 text-center">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function DetailRow({ label, value, }: { label: string; value: ReactNode; }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 bg-background/40 px-3 py-2.5 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground">{value}</dd>
    </div>
  );
}
