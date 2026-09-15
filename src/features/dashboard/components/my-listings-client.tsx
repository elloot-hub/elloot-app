"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { fetchMyListings } from "@/features/listings/api";
import { fetchSellerMetrics } from "@/features/orders/api";
import { ListingDashboardCard } from "@/features/dashboard/components/listing-dashboard-card";
import { ListingsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { useDashboardQueryState } from "@/features/dashboard/hooks/use-dashboard-query-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { routes } from "@/lib/routes";
import type { ListingDetail, ListingStatus } from "@/types/api";
import { ApiError } from "@/lib/api/errors";

const STATUS_FILTERS: Array<{ id: "all" | ListingStatus; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "ACTIVE", label: "Ativos" },
  { id: "PAUSED", label: "Pausados" },
  { id: "PENDING_REVIEW", label: "Em análise" },
  { id: "DRAFT", label: "Rascunhos" },
  { id: "REJECTED", label: "Rejeitados" },
];

const STATUS_ITEMS = STATUS_FILTERS.map((item) => ({
  value: item.id,
  label: item.label,
}));

type ListingMetrics = {
  uniqueVisits: number;
  conversionPercent: number;
  sales: number;
};

function parseStatus(value: string | null): "all" | ListingStatus {
  if (!value || value === "all") return "all";
  if (STATUS_FILTERS.some((item) => item.id === value)) {
    return value as ListingStatus;
  }
  return "all";
}

function MyListingsClientInner() {
  const { searchParams, replaceParams } = useDashboardQueryState();
  const status = parseStatus(searchParams.get("status"));
  const queryFromUrl = searchParams.get("q") ?? "";

  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [metricsByListing, setMetricsByListing] = useState<
    Record<string, ListingMetrics>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(queryFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ listings: rows }, metricsResult] = await Promise.all([
        fetchMyListings(),
        fetchSellerMetrics({ range: "30d" }).catch(() => null),
      ]);
      setListings(rows);
      if (metricsResult?.metrics?.listings) {
        const map: Record<string, ListingMetrics> = {};
        for (const row of metricsResult.metrics.listings) {
          map[row.listingId] = {
            uniqueVisits: row.uniqueVisits,
            conversionPercent: row.conversionPercent,
            sales: row.sales,
          };
        }
        setMetricsByListing(map);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar seus anúncios.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  useEffect(() => {
    setQuery(queryFromUrl);
    setDebouncedQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = query.trim();
      setDebouncedQuery(next);
      if (next !== queryFromUrl) {
        replaceParams({ q: next || null });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, queryFromUrl, replaceParams]);

  const visible = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return listings.filter((listing) => {
      if (status !== "all" && listing.status !== status) return false;
      if (!q) return true;
      return listing.title.toLowerCase().includes(q);
    });
  }, [listings, status, debouncedQuery]);

  function handleListingUpdated(updated: ListingDetail) {
    setListings((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row)),
    );
  }

  if (loading) {
    return <ListingsSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Você ainda não publicou anúncios.
        </p>
        <Link
          href={routes.sell}
          className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Criar primeiro anúncio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={status}
          items={STATUS_ITEMS}
          onValueChange={(value) => {
            const next = (value ?? "all") as "all" | ListingStatus;
            replaceParams({
              status: next === "all" ? null : next,
            });
          }}
        >
          <SelectTrigger className="w-44 sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar anúncio…"
            className="h-9 rounded-md pl-9"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum anúncio com esses filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((listing) => (
            <ListingDashboardCard
              key={listing.id}
              listing={listing}
              metrics={metricsByListing[listing.id]}
              onUpdated={handleListingUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MyListingsClient() {
  return (
    <Suspense fallback={<ListingsSkeleton />}>
      <MyListingsClientInner />
    </Suspense>
  );
}
