"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  fetchListingPlacements,
  fetchVisibilityProducts,
  purchaseListingVisibility,
  type ListingPlacement,
  type VisibilityProductPublic,
} from "@/features/visibility/api";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  listingStatus: string;
  categoryId?: string | null;
};

function formatDuration(hours: number) {
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 dia" : `${days} dias`;
}

function remainingLabel(endsAt: string | null) {
  if (!endsAt) return "Sem expiração";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h restantes`;
  const days = Math.ceil(hours / 24);
  return `${days}d restantes`;
}

export function ListingVisibilityPanel({
  listingId,
  listingStatus,
  categoryId,
}: Props) {
  const [products, setProducts] = useState<VisibilityProductPublic[]>([]);
  const [placements, setPlacements] = useState<ListingPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, placeRes] = await Promise.all([
        fetchVisibilityProducts(),
        fetchListingPlacements(listingId),
      ]);
      setProducts(prodRes.products);
      setPlacements(placeRes.placements);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar os produtos de visibilidade.",
      );
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeByProduct = useMemo(() => {
    const map = new Map<string, ListingPlacement>();
    const now = Date.now();
    for (const p of placements) {
      if (p.status !== "ACTIVE") continue;
      if (p.endsAt && new Date(p.endsAt).getTime() <= now) continue;
      map.set(p.productId, p);
    }
    return map;
  }, [placements]);

  const queuedByProduct = useMemo(() => {
    const map = new Map<string, ListingPlacement>();
    for (const p of placements) {
      if (p.status === "PENDING") map.set(p.productId, p);
    }
    return map;
  }, [placements]);

  const eligibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.scope !== "CATEGORY" || !p.categoryId) return true;
      if (!categoryId) return true;
      return p.categoryId === categoryId;
    });
  }, [products, categoryId]);

  async function onBuy(productId: string) {
    setBuyingId(productId);
    setError(null);
    setOkMsg(null);
    try {
      const res = await purchaseListingVisibility(listingId, productId);
      setOkMsg(
        res.queued
          ? "Você entrou na fila. O impulso ativa quando houver vaga."
          : res.extended
            ? "Impulso renovado com sucesso."
            : "Visibilidade ativada com sucesso.",
      );
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.code === "INSUFFICIENT_BALANCE") {
        setError(
          "Saldo insuficiente na carteira. Deposite ou libere valores para impulsionar.",
        );
      } else if (err instanceof ApiError && err.code === "VISIBILITY_SLOTS_FULL") {
        setError("Slots esgotados e a fila está desativada para este produto.");
      } else if (
        err instanceof ApiError &&
        err.code === "VISIBILITY_ALREADY_QUEUED"
      ) {
        setError("Este anúncio já está na fila deste produto.");
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível concluir a compra.",
        );
      }
    } finally {
      setBuyingId(null);
    }
  }

  if (listingStatus !== "ACTIVE") {
    return (
      <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
        Publique o anúncio (status ativo) para comprar impulsos de
        visibilidade.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {okMsg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando produtos…</p>
      ) : eligibleProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum produto de visibilidade disponível no momento.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eligibleProducts.map((product) => {
            const active = activeByProduct.get(product.id);
            const queued = queuedByProduct.get(product.id);
            const slotsFull =
              product.slotsAvailable != null && product.slotsAvailable <= 0;
            const canQueue = Boolean(product.queueEnabled) && slotsFull && !active;
            return (
              <div
                key={product.id}
                className={cn(
                  "flex flex-col gap-2 rounded-md border p-4",
                  active
                    ? "border-primary/40 bg-primary/5"
                    : queued
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border/60 bg-muted/15",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-heading text-sm font-semibold">
                    {product.name}
                  </span>
                  {product.badgeLabel ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {product.badgeLabel}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-primary">
                  {product.priceCents === 0
                    ? "Grátis"
                    : formatBRLFromCents(product.priceCents)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    · {formatDuration(product.durationHours)}
                  </span>
                </p>
                {product.maxActiveSlots != null ? (
                  <p className="text-[11px] text-muted-foreground">
                    Slots {product.slotsUsed ?? 0}/{product.maxActiveSlots}
                    {product.queuedCount
                      ? ` · ${product.queuedCount} na fila`
                      : ""}
                  </p>
                ) : null}
                {product.description ? (
                  <p className="text-xs text-muted-foreground text-pretty">
                    {product.description}
                  </p>
                ) : null}
                {active ? (
                  <p className="text-xs font-medium text-primary">
                    Ativo · {remainingLabel(active.endsAt)}
                  </p>
                ) : queued ? (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Na fila — ativa quando houver vaga
                  </p>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="mt-auto"
                  disabled={
                    buyingId === product.id ||
                    Boolean(queued) ||
                    (slotsFull && !product.queueEnabled && !active)
                  }
                  onClick={() => void onBuy(product.id)}
                >
                  {buyingId === product.id
                    ? "Processando…"
                    : queued
                      ? "Na fila"
                      : active
                        ? "Renovar com carteira"
                        : canQueue
                          ? "Entrar na fila"
                          : slotsFull && !product.queueEnabled
                            ? "Slots esgotados"
                            : "Comprar com carteira"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        O valor é debitado da{" "}
        <Link
          href={routes.dashboardWallet}
          className={cn(
            buttonVariants({ variant: "link" }),
            "h-auto p-0 text-xs",
          )}
        >
          carteira
        </Link>
        . PIX para impulsos chega na próxima etapa.
      </p>
    </div>
  );
}
