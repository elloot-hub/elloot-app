"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangleIcon,
  ClockIcon,
  ScaleIcon,
  ShieldAlertIcon,
  XIcon,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MIN_REASON = 10;
const MAX_REASON = 2000;

type Props = {
  open: boolean;
  onClose: () => void;
  order: Order;
  canOpen: boolean;
  onOpened: () => Promise<void> | void;
};

export function ReportProblemDialog({
  open,
  onClose,
  order,
  canOpen,
  onOpened,
}: Props) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const dispute = order.dispute ?? null;
  const trimmed = reason.trim();
  const remaining = Math.max(0, MIN_REASON - trimmed.length);
  const escrowHeld = Boolean(order.escrowHold && !order.escrowHold.releasedAt);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-problem-title"
        className="relative z-[80] flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-border/60 bg-background shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
          <div className="min-w-0 space-y-2">
            <Badge variant="secondary" className="gap-1">
              <ScaleIcon className="size-3" />
              Solicitar moderação
            </Badge>
            <div>
              <h2
                id="report-problem-title"
                className="text-lg font-semibold tracking-tight"
              >
                Relatar problema
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Descreva o ocorrido com detalhes para a equipe Elloot analisar.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onClose}
            aria-label="Fechar"
          >
            <XIcon className="size-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {dispute ? (
            <div className="space-y-3 rounded-md border border-orange-500/25 bg-orange-500/10 p-4">
              <div className="flex items-start gap-2 text-sm">
                <ScaleIcon className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">Disputa já aberta</p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      disputeStatusTone(dispute.status),
                    )}
                  >
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
                <p className="rounded-md border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
                  Nota da mediação: {dispute.notes}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex gap-3 rounded-md border border-primary/25 bg-primary/10 p-3">
                <ClockIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium">Proteção Elloot</p>
                  <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                    Abra a disputa enquanto o pedido está pago ou entregue. O
                    escrow fica retido até a mediação.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-3">
                <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium">Saldo do vendedor</p>
                  <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                    {escrowHeld
                      ? "O valor ainda está retido. Ao abrir a mediação ele permanece bloqueado até a resolução."
                      : "Ao abrir a mediação o pedido entra em disputa e o valor fica retido até a decisão."}
                  </p>
                </div>
              </div>

              {!canOpen ? (
                <p className="text-sm text-muted-foreground">
                  Não é possível abrir disputa neste status do pedido.
                </p>
              ) : (
                <>
                  <Textarea
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value.slice(0, MAX_REASON))
                    }
                    placeholder={`Descreva o problema com no mínimo ${MIN_REASON} caracteres…`}
                    rows={5}
                    disabled={pending}
                    className="rounded-md"
                    aria-invalid={
                      trimmed.length > 0 && trimmed.length < MIN_REASON
                        ? true
                        : undefined
                    }
                  />
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangleIcon className="size-3" />
                      {remaining > 0
                        ? `Faltam ${remaining} caracteres`
                        : "Seja objetivo e factual"}
                    </span>
                    <span className="tabular-nums">
                      {trimmed.length} / {remaining > 0 ? MIN_REASON : MAX_REASON}{" "}
                      caracteres
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3 sm:px-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {dispute || !canOpen ? (
            <Button type="button" onClick={onClose}>
              Entendi
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={pending || trimmed.length < MIN_REASON}
              onClick={() => {
                void (async () => {
                  setPending(true);
                  setError(null);
                  try {
                    await openDispute(order.id, trimmed);
                    await onOpened();
                    onClose();
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
              {pending ? "Enviando…" : "Continuar"}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
