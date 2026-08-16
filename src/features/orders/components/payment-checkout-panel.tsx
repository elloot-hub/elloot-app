"use client";

import { useEffect, useId, useState } from "react";
import { CheckIcon, CopyIcon, CreditCardIcon, Loader2Icon, QrCodeIcon, ShieldCheckIcon, } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "@/features/orders/api";
import { useCountdown } from "@/features/orders/hooks/use-countdown";
import { usePixQrDataUrl } from "@/features/orders/hooks/use-pix-qr";
import type { OrderCheckout } from "@/features/orders/types";
import { formatBRLFromCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type CheckoutUiPhase = | "loading" | "ready" | "awaiting" | "paid" | "expired";

type Props = {
  checkout: OrderCheckout | null;
  loadingCheckout?: boolean;
  amountCents: number;
  expiresAt?: string | null;
  listingTitle: string;
  methods: PaymentMethod[];
  methodsLoading?: boolean;
  phase: CheckoutUiPhase;
  actionPending?: boolean;
  statusMessage?: string | null;
  onConfirmSandbox?: () => void;
  onSyncEfi?: () => void;
  onCancel?: () => void;
  onRenew?: () => void;
};

const METHOD_ICONS = {
  pix: QrCodeIcon,
  card: CreditCardIcon,
} as const;

const PIX_STEPS = [
  "Abra o app do seu banco ou carteira digital",
  "Escolha pagar via PIX e escaneie o QR Code",
  "Ou cole o código copia e cola",
  "Confirme o pagamento — detectamos automaticamente",
] as const;

export function PaymentCheckoutPanel({ checkout, loadingCheckout, amountCents, expiresAt, listingTitle, methods, methodsLoading, phase, actionPending, statusMessage, onConfirmSandbox, onSyncEfi, onCancel, onRenew, }: Props) {
  const statusId = useId();
  const [methodId, setMethodId] = useState("pix");
  const [step, setStep] = useState<"method" | "pay">("pay");
  const [copied, setCopied] = useState(false);

  const effectiveExpires = checkout?.expiresAt ?? expiresAt ?? null;
  const { label: countdown, expired } = useCountdown(effectiveExpires);
  const { dataUrl: qrDataUrl, loading: qrLoading } = usePixQrDataUrl(
    checkout?.pixCopyPaste,
    checkout?.qrCodeImage,
  );

  const isEfi = checkout?.provider === "efi";
  const isSandbox = checkout?.provider === "sandbox";
  const amount = formatBRLFromCents(checkout?.amountCents ?? amountCents);

  const availableMethods =
    methods.length > 0
      ? methods
      : [
        {
          id: "pix" as const,
          label: "PIX",
          hint: "Aprovação na hora",
          available: true,
        },
        {
          id: "card" as const,
          label: "Cartão",
          hint: "Em breve",
          available: false,
        },
      ];

  const selected = availableMethods.find((m) => m.id === methodId) ?? availableMethods[0];
  const uiPhase: CheckoutUiPhase = phase === "paid" ? "paid" : expired || phase === "expired" ? "expired" : loadingCheckout || phase === "loading" ? "loading" : phase === "awaiting" ? "awaiting" : "ready";

  useEffect(() => {
    const first = availableMethods.find((m) => m.available);
    if (
      first &&
      !availableMethods.some((m) => m.id === methodId && m.available)
    ) {
      setMethodId(first.id);
    }
  }, [availableMethods, methodId]);

  async function copyPix() {
    if (!checkout?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(checkout.pixCopyPaste);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const liveStatus = statusMessage ?? (uiPhase === "loading" ? "Gerando cobrança PIX…" : uiPhase === "awaiting" ? "Aguardando confirmação. Detectamos o pagamento automaticamente. Mantenha a página aberta." : uiPhase === "paid" ? "Pagamento confirmado. Redirecionando…" : uiPhase === "expired" ? "A reserva deste pagamento expirou." : "Escaneie o QR Code ou use o código copia e cola.");
  if (uiPhase === "expired") {
    return (
      <section className="space-y-4 rounded-md border border-border/60 bg-card/50 p-4 sm:p-5">
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {liveStatus}
        </div>
        <p className="text-sm text-muted-foreground text-pretty">
          Cancele este pedido e compre novamente pelo anúncio para gerar um
          novo PIX.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onRenew ? (
            <Button type="button" className="h-11 flex-1" onClick={onRenew}>
              Comprar novamente
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              disabled={actionPending}
              onClick={onCancel}
            >
              Cancelar pedido
            </Button>
          ) : null}
        </div>
      </section>
    );
  };

  if (uiPhase === "paid") {
    return (
      <section className="space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
        <p
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckIcon className="size-4" aria-hidden />
          {liveStatus}
        </p>
      </section>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-4">
      {step === "method" ? (
        <section className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-md border border-border/60 bg-card/50 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold">Forma de pagamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o método disponível para concluir a compra.
            </p>
          </div>

          {methodsLoading ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-md border border-border/50 bg-muted/30" />
              <div className="h-24 animate-pulse rounded-md border border-border/50 bg-muted/30" />
            </div>
          ) : (
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Método de pagamento"
            >
              {availableMethods.map((item) => {
                const Icon = METHOD_ICONS[item.id] ?? QrCodeIcon;
                const isSelected = selected?.id === item.id;
                const recommended = item.id === "pix" && item.available;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!item.available}
                    onClick={() => setMethodId(item.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-md border px-3 py-3 text-left transition-colors",
                      item.available
                        ? isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/60 bg-background/40 hover:bg-muted/30"
                        : "cursor-not-allowed border-border/40 bg-muted/20 opacity-55",
                    )}
                  >
                    {recommended ? (
                      <span className="absolute top-2 right-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-foreground uppercase">
                        Recomendado
                      </span>
                    ) : null}
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.available ? "Instantâneo" : "Indisponível"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {onCancel ? (
              <Button
                type="button"
                variant="ghost"
                disabled={actionPending}
                onClick={onCancel}
              >
                Cancelar pedido
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              className="h-11 sm:min-w-48"
              disabled={!selected?.available || selected.id !== "pix"}
              onClick={() => setStep("pay")}
            >
              Continuar com PIX
            </Button>
          </div>
        </section>
      ) : null}

      {step === "pay" && selected?.id === "pix" ? (
        <section className="min-w-0 max-w-full space-y-5 overflow-hidden rounded-md border border-border/60 bg-card/50 p-4 sm:p-5">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">Pagamento via PIX</h2>
              </div>
              <button
                type="button"
                className="cursor-pointer text-sm font-medium text-primary hover:underline"
                onClick={() => setStep("method")}
              >
                Trocar método
              </button>
            </div>
            {countdown ? (
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-muted-foreground">
                  Tempo para o pagamento
                </p>
                <p className="text-2xl font-semibold tabular-nums text-primary">
                  {countdown}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col items-center gap-2">
            <Badge variant="default">
              <span className="inline-flex items-center gap-1">
                <ShieldCheckIcon className="size-3.5" aria-hidden />
                Protegido pela Elloot
              </span>
            </Badge>

            <div
              className="mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center rounded-md border border-border/60 bg-white p-3 sm:max-w-[240px]"
              aria-busy={uiPhase === "loading" || qrLoading}
            >
              {uiPhase === "loading" || qrLoading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2Icon className="size-5 animate-spin" aria-hidden />
                  <span className="text-xs">Gerando QR Code PIX</span>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code PIX no valor de ${amount} para pagar ${listingTitle}`}
                  className="size-full max-w-full object-contain select-none pointer-events-none"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-muted-foreground">
                  <QrCodeIcon className="size-7 opacity-40" aria-hidden />
                  Aguardando código
                </div>
              )}
            </div>
          </div>

          <div
            id={statusId}
            role="status"
            aria-live="polite"
            className={cn(
              "flex min-w-0 items-start justify-center gap-2 text-center text-sm text-pretty",
              uiPhase === "awaiting"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                uiPhase === "awaiting"
                  ? "animate-pulse bg-primary"
                  : "bg-muted-foreground/50",
              )}
              aria-hidden
            />
            <span className="min-w-0 break-words">
              {uiPhase === "awaiting" ? (
                <span className="inline-flex flex-wrap items-center justify-center gap-2">
                  <Loader2Icon className="size-3.5 shrink-0 animate-spin" aria-hidden />
                  {liveStatus}
                </span>
              ) : (
                liveStatus
              )}
            </span>
          </div>

          {checkout?.pixCopyPaste ? (
            <div className="min-w-0 max-w-full space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Ou use o código copia e cola
              </p>
              <div className="flex min-w-0 max-w-full flex-row gap-2 sm:flex-row sm:items-stretch">
                <code
                  className="block min-w-0 max-w-full flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 font-mono text-[11px]"
                  title={checkout.pixCopyPaste}
                >
                  {checkout.pixCopyPaste}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-1.5 rounded-md px-3"
                  autoFocus={uiPhase === "ready"}
                  onClick={() => void copyPix()}
                  aria-describedby={statusId}
                  aria-label="Copiar código PIX"
                >
                  {copied ? (
                    <CheckIcon className="size-4" aria-hidden />
                  ) : (
                    <CopyIcon className="size-4" aria-hidden />
                  )}
                  <span>{copied ? "Copiado" : "Copiar"}</span>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-row gap-2">
            {isEfi ? (
              <Button
                type="button"
                className="h-10 flex-1"
                disabled={
                  actionPending ||
                  !checkout?.providerRef ||
                  uiPhase === "loading"
                }
                onClick={onSyncEfi}
              >
                {uiPhase === "awaiting" || actionPending
                  ? "Verificando…"
                  : "Já paguei — verificar"}
              </Button>
            ) : null}
            {isSandbox ? (
              <Button
                type="button"
                className="h-10 flex-1"
                disabled={
                  actionPending ||
                  !checkout?.providerRef ||
                  uiPhase === "loading"
                }
                onClick={onConfirmSandbox}
              >
                {actionPending ? "Confirmando…" : "Simular pagamento PIX"}
              </Button>
            ) : null}
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                className="h-10"
                disabled={actionPending}
                onClick={onCancel}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === "pay" && selected?.id === "pix" ? (
        <>
          <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Como pagar com PIX</h3>
            </div>
            <ol className="min-w-0 space-y-3">
              {PIX_STEPS.map((text, index) => (
                <li key={text} className="flex min-w-0 gap-3 text-sm">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      index === PIX_STEPS.length - 1
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {index === PIX_STEPS.length - 1 ? (
                      <CheckIcon className="size-3.5" aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="min-w-0 pt-0.5 break-words text-muted-foreground text-pretty">
                    {text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          
        </>
      ) : null}

      {step === "pay" && selected?.id !== "pix" ? (
        <section className="rounded-md border border-dashed border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          Este método ainda não está disponível.{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setMethodId("pix");
              setStep("pay");
            }}
          >
            Voltar para PIX
          </button>
        </section>
      ) : null}
    </div>
  );
};