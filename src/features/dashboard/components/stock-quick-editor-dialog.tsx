"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2Icon, MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateListingStock } from "@/features/listings/api";
import {
  NumberedStockTextarea,
  countAutoLines,
  parseAutoStockLines,
} from "@/features/listings/components/numbered-stock-textarea";
import { ApiError } from "@/lib/api/errors";
import { listingRouteRef } from "@/lib/public-codes";
import type { ListingDetail } from "@/types/api";

type Props = {
  listing: ListingDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (listing: ListingDetail) => void;
};

function stockTextFromItems(
  items: Array<{ id: string; content: string }> | undefined,
) {
  return (items ?? []).map((item) => item.content).join("\n");
}

export function StockQuickEditorDialog({
  listing,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const isDynamic = listing.listingModel === "DYNAMIC";
  const offers = listing.offers ?? [];

  const [offerId, setOfferId] = useState<string>(offers[0]?.id ?? "");
  const [manualQty, setManualQty] = useState(String(listing.stockQuantity));
  const [stockText, setStockText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOffer = useMemo(
    () => offers.find((o) => o.id === offerId) ?? null,
    [offers, offerId],
  );

  const offerSelectItems = useMemo(
    () =>
      offers.map((offer) => ({
        value: offer.id,
        label: `${offer.title} · ${offer.stockQuantity} un.${
          offer.deliveryMode === "AUTO" ? " · auto" : ""
        }`,
      })),
    [offers],
  );

  const deliveryMode = isDynamic
    ? (selectedOffer?.deliveryMode ?? "MANUAL")
    : (listing.deliveryMode ?? "MANUAL");
  const isAuto = deliveryMode === "AUTO";
  const unitCount = countAutoLines(stockText);
  const currentManual = Number(manualQty);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPending(false);

    if (isDynamic) {
      const first = offers[0];
      const nextOfferId = first?.id ?? "";
      setOfferId(nextOfferId);
      setManualQty(String(first?.stockQuantity ?? 1));
      setStockText(stockTextFromItems(first?.autoStockItems));
    } else {
      setManualQty(String(listing.stockQuantity));
      setStockText(stockTextFromItems(listing.autoStockItems));
    }
  }, [open, listing.id]);

  useEffect(() => {
    if (!open || !isDynamic || !offerId) return;
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;
    setManualQty(String(offer.stockQuantity));
    setStockText(stockTextFromItems(offer.autoStockItems));
    setError(null);
  }, [offerId, open, isDynamic, offers]);

  function bumpManual(delta: number) {
    setManualQty((prev) => {
      const n = Number(prev);
      const base = Number.isInteger(n) && n >= 0 ? n : 0;
      return String(Math.max(0, Math.min(1_000_000, base + delta)));
    });
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    try {
      const payload: Parameters<typeof updateListingStock>[1] = {};
      if (isDynamic) {
        if (!offerId) {
          setError("Selecione uma oferta.");
          setPending(false);
          return;
        }
        payload.offerId = offerId;
      }

      if (isAuto) {
        const lines = parseAutoStockLines(stockText);
        payload.replaceLines = lines;
      } else {
        const qty = Number(manualQty);
        if (!Number.isInteger(qty) || qty < 0) {
          setError("Informe um estoque válido (0 ou mais).");
          setPending(false);
          return;
        }
        payload.stockQuantity = qty;
      }

      const { listing: updated } = await updateListingStock(
        listingRouteRef(listing),
        payload,
      );
      onUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível atualizar o estoque.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogBackdrop />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Estoque rápido
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {listing.title}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {isDynamic && offers.length > 0 ? (
            <Field>
              <FieldLabel>Oferta</FieldLabel>
              <Select
                value={offerId}
                items={offerSelectItems}
                onValueChange={(value) => setOfferId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma oferta" />
                </SelectTrigger>
                <SelectContent>
                  {offers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.title} · {offer.stockQuantity} un.
                      {offer.deliveryMode === "AUTO" ? " · auto" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {isAuto ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>Estoque do item</FieldLabel>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {unitCount} unidade{unitCount === 1 ? "" : "s"}
                </span>
              </div>
              <NumberedStockTextarea
                value={stockText}
                onChange={setStockText}
                placeholder="Digite uma chave ou login por linha"
              />
            </div>
          ) : (
            <Field>
              <FieldLabel>Quantidade em estoque</FieldLabel>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => bumpManual(-1)}
                  aria-label="Diminuir"
                >
                  <MinusIcon className="size-3.5" />
                </Button>
                <Input
                  value={manualQty}
                  onChange={(e) =>
                    setManualQty(e.target.value.replace(/\D/g, "").slice(0, 7))
                  }
                  inputMode="numeric"
                  className="text-center tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => bumpManual(1)}
                  aria-label="Aumentar"
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              </div>
              <FieldDescription>
                {Number.isInteger(currentManual)
                  ? `${currentManual} unidade${currentManual === 1 ? "" : "s"}`
                  : "Informe um número inteiro."}
              </FieldDescription>
            </Field>
          )}

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Salvar estoque"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
