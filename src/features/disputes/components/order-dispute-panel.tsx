"use client";

import { useState } from "react";
import { AlertTriangleIcon, ScaleIcon } from "lucide-react";
import { openDispute } from "@/features/disputes/api";
import {
  disputeResolutionLabel,
  disputeStatusLabel,
  disputeStatusTone,
} from "@/features/disputes/labels";
import type { Order } from "@/features/orders/types";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MIN_REASON = 10;
const MAX_REASON = 2000;

type Props = {
  order: Order;
  canOpen: boolean;
  disabled?: boolean;
  onOpened: () => Promise<void> | void;
};

export function OrderDisputePanel({
  order,
  canOpen,
  disabled,
  onOpened,
}: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispute = order.dispute ?? null;

  if (dispute) {
    return (
      <div className="space-y-3 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-5">
        <div className="flex items-start gap-2 text-sm">
          <ScaleIcon className="mt-0.5 size-4 shrink-0 text-orange-500" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium">Disputa do pedido</p>
            <p className={cn("text-xs font-medium", disputeStatusTone(dispute.status))}>
              {disputeStatusLabel(dispute.status)}
              {dispute.resolution
                ? ` · ${disputeResolutionLabel(dispute.resolution)}`
                : null}
            </p>
          </div>
        </div>
        <p className="text-sm text-pretty text-muted-foreground whitespace-pre-wrap">
          {dispute.reason}
        </p>
        {dispute.notes ? (
          <p className="rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
            Nota da mediação: {dispute.notes}
          </p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          Aberta em{" "}
          {new Date(dispute.createdAt).toLocaleString("pt-BR")}
          {dispute.status === "OPEN"
            ? " · a equipe Elloot analisa o caso. Use o chat para alinhar detalhes."
            : null}
        </p>
      </div>
    );
  }

  if (!canOpen) return null;

  if (!openForm) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-5">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-muted-foreground text-pretty">
            Problema com a entrega ou o produto? Abra uma disputa para pausar o
            escrow até a mediação.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl"
          disabled={disabled}
          onClick={() => {
            setOpenForm(true);
            setError(null);
          }}
        >
          Abrir disputa
        </Button>
      </div>
    );
  }

  const trimmed = reason.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_REASON;

  return (
    <form
      className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed.length < MIN_REASON || pending || disabled) return;
        void (async () => {
          setPending(true);
          setError(null);
          try {
            await openDispute(order.id, trimmed);
            setReason("");
            setOpenForm(false);
            await onOpened();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Não foi possível abrir a disputa.",
            );
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="flex items-start gap-2 text-sm">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <div className="space-y-1">
          <p className="font-medium">Abrir disputa</p>
          <p className="text-xs text-muted-foreground text-pretty">
            Descreva o problema com pelo menos {MIN_REASON} caracteres. O pedido
            passa para “Em disputa” e o escrow fica retido.
          </p>
        </div>
      </div>

      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
        placeholder="Ex.: não recebi o item / credenciais inválidas / produto diferente do anúncio…"
        rows={4}
        disabled={pending || disabled}
        className="rounded-xl"
        aria-invalid={tooShort || undefined}
      />
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          {tooShort
            ? `Faltam ${MIN_REASON - trimmed.length} caracteres`
            : "Seja objetivo e factual"}
        </span>
        <span className="tabular-nums">
          {trimmed.length}/{MAX_REASON}
        </span>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          variant="destructive"
          className="h-10 flex-1 rounded-xl"
          disabled={
            pending || disabled || trimmed.length < MIN_REASON
          }
        >
          {pending ? "Enviando…" : "Confirmar disputa"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-10 rounded-xl"
          disabled={pending}
          onClick={() => {
            setOpenForm(false);
            setError(null);
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
