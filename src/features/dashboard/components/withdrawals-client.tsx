"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  InfoIcon,
  KeyRoundIcon,
  ShieldAlertIcon,
  WalletIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth/context";
import { fetch2faStatus } from "@/features/auth/two-factor-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { WalletSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { fetchWallet } from "@/features/wallet";
import {
  createPayout,
  fetchMyPayouts,
  type Payout,
} from "@/features/wallet/payouts-api";
import { ApiError } from "@/lib/api/errors";
import {
  formatBRLFromCents,
  formatDateTimePt,
  formatPriceMask,
  parseBrlToCents,
} from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const MIN_PAYOUT_CENTS = 500;

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Em análise",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};

type WithdrawStep = "amount" | "destination" | "confirm";

const STEPS: Array<{ id: WithdrawStep; label: string }> = [
  { id: "amount", label: "Valor" },
  { id: "destination", label: "Destino" },
  { id: "confirm", label: "Confirmação" },
];

function WithdrawStepper({ current, onSelect, maxReachedIndex, }: { current: WithdrawStep; onSelect?: (id: WithdrawStep) => void; maxReachedIndex: number; }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Etapas da retirada" className="flex justify-center">
      <ol className="inline-flex max-w-full items-center gap-1.5 sm:gap-2">
        {STEPS.map((step, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          const reachable = index <= maxReachedIndex;
          return (
            <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-6 shrink-0 sm:w-8",
                    index <= currentIndex ? "bg-primary/50" : "bg-border",
                  )}
                />
              ) : null}
              <button
                type="button"
                disabled={!reachable || !onSelect}
                onClick={() => onSelect?.(step.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-1 text-left outline-none transition-colors sm:px-2.5",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : done
                      ? "border-primary/20 bg-primary/5 text-muted-foreground"
                      : "border-border/60 bg-muted/20 text-muted-foreground/70",
                  !reachable && "cursor-default opacity-50",
                  reachable && onSelect && "cursor-pointer hover:border-primary/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    active || done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2Icon className="size-3" /> : index + 1}
                </span>
                <span className="truncate text-xs font-medium">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const AMOUNT_FONT_CLASS = "font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl";

function WithdrawAmountInput({ value, onChange, disabled, }: { value: string; onChange: (value: string) => void; disabled?: boolean; }) {
  const display = value || "0,00";
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    setInputWidth(el.getBoundingClientRect().width);
  }, [display]);

  return (
    <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-full justify-center">
        <label className="inline-flex shrink-0 items-baseline">
          <span className="sr-only">Valor da retirada</span>
          <span
            aria-hidden
            className={cn(
              "shrink-0 select-none text-foreground/75",
              AMOUNT_FONT_CLASS,
            )}
          >
            R$
          </span>
          <span className="relative inline-block">
            <span
              ref={measureRef}
              aria-hidden
              className={cn(
                "pointer-events-none invisible absolute top-0 left-0 whitespace-pre",
                AMOUNT_FONT_CLASS,
              )}
            >
              {display}
            </span>
            <input
              value={value}
              onChange={(e) => onChange(formatPriceMask(e.target.value))}
              inputMode="numeric"
              placeholder="0,00"
              disabled={disabled}
              className={cn(
                "m-0 min-w-[4ch] border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground/40",
                AMOUNT_FONT_CLASS,
              )}
              style={inputWidth ? { width: `${inputWidth}px` } : undefined}
            />
          </span>
        </label>
      </div>
    </div>
  );
}

export function WithdrawalsClient() {
  const { user, refreshUser } = useAuth();
  const kycStatus = user?.kycStatus ?? "NONE";
  const kycApproved = kycStatus === "APPROVED";
  const kycPending = kycStatus === "PENDING";

  const [balanceCents, setBalanceCents] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [amountMask, setAmountMask] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [step, setStep] = useState<WithdrawStep>("amount");
  const [maxReached, setMaxReached] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const amountCents = useMemo(
    () => parseBrlToCents(amountMask) ?? 0,
    [amountMask],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [wallet, { payouts: rows }, twoFa] = await Promise.all([
        fetchWallet(),
        fetchMyPayouts(),
        fetch2faStatus().catch(() => ({ enabled: false })),
      ]);
      setBalanceCents(wallet.balanceCents);
      setPayouts(rows);
      setPixKey((prev) => prev || user?.pixKey || "");
      setTotpEnabled(Boolean(twoFa.enabled));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar as retiradas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [user?.pixKey]);

  function goTo(next: WithdrawStep) {
    setError(null);
    setSuccess(null);
    setStep(next);
    const idx = STEPS.findIndex((s) => s.id === next);
    setMaxReached((prev) => Math.max(prev, idx));
  }

  function resetFlow() {
    setAmountMask("");
    setStep("amount");
    setMaxReached(0);
    setError(null);
    setTotpCode("");
  }

  function validateAmount(): string | null {
    if (!amountCents || amountCents < MIN_PAYOUT_CENTS) {
      return "Valor mínimo de R$ 5,00 por retirada.";
    }
    if (amountCents > balanceCents) {
      return "Saldo insuficiente para este valor.";
    }
    return null;
  }

  function validateDestination(): string | null {
    const key = pixKey.trim();
    if (key.length < 3) return "Informe uma chave PIX válida.";
    if (key.length > 140) return "Chave PIX muito longa.";
    return null;
  }

  function advanceFromAmount() {
    const err = validateAmount();
    if (err) {
      setError(err);
      return;
    }
    goTo("destination");
  }

  function advanceFromDestination() {
    const err = validateDestination();
    if (err) {
      setError(err);
      return;
    }
    goTo("confirm");
  }

  async function confirmPayout() {
    const amountErr = validateAmount();
    if (amountErr) {
      setError(amountErr);
      goTo("amount");
      return;
    }
    const destErr = validateDestination();
    if (destErr) {
      setError(destErr);
      goTo("destination");
      return;
    }
    if (!kycApproved) {
      setError("Verifique sua identidade para solicitar saques.");
      return;
    }
    if (totpEnabled && totpCode.trim().length < 6) {
      setError("Digite o código 2FA de 6 dígitos para confirmar o saque.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createPayout({
        amountCents,
        pixKey: pixKey.trim() || undefined,
        totpCode: totpEnabled ? totpCode.trim() : undefined,
      });
      setSuccess("Retirada solicitada. O valor saiu do saldo disponível.");
      resetFlow();
      await refreshUser();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível solicitar a retirada.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function setMaxAmount() {
    if (balanceCents < MIN_PAYOUT_CENTS) return;
    setAmountMask(formatPriceMask(String(balanceCents)));
    setError(null);
  }

  if (loading) return <WalletSkeleton />;

  return (
    <div className="space-y-5">
      <div className="grid gap-2 grid-cols-2 md:grid-cols-2">
        <div className="flex h-full items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary p-4 text-primary-foreground shadow-sm sm:col-span-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <WalletIcon className="size-4 shrink-0 opacity-90" />
              <p className="text-sm font-medium opacity-90">Saldo disponível</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatBRLFromCents(balanceCents)}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Pronto para transferência via PIX.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-border/60 bg-card/40 p-4">
          <p className="text-sm font-medium text-muted-foreground">Identidade</p>
          <p className="mt-2 flex items-center gap-1.5 text-lg font-semibold">
            {kycApproved ? (
              <>
                <BadgeCheckIcon className="size-5 text-emerald-500" />
                Verificada
              </>
            ) : kycPending ? (
              <>
                <InfoIcon className="size-5 text-amber-500" />
                Em análise
              </>
            ) : (
              <>
                <ShieldAlertIcon className="size-5 text-amber-500" />
                Pendente
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground text-pretty">
            {kycApproved
              ? "Você pode solicitar retiradas normalmente."
              : "A verificação é obrigatória só para saques — anúncios não exigem."}
          </p>
        </div>
      </div>

      {!kycApproved ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            kycPending
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-amber-500/40 bg-amber-500/10",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {kycPending
                ? "Verificação em análise"
                : kycStatus === "REJECTED"
                  ? "Verificação recusada"
                  : "Verifique sua identidade para sacar"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
              {kycPending
                ? "Assim que a análise for concluída, você poderá solicitar retiradas."
                : "Criar anúncios continua liberado. A verificação é exigida apenas para transferir saldo."}
            </p>
          </div>
          {!kycPending ? (
            <Link
              href={routes.dashboardVerification}
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
            >
              {kycStatus === "REJECTED" ? "Reenviar documentos" : "Verificar agora"}
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Nova retirada</h2>
          <p className="text-xs text-muted-foreground">
            Solicite a transferência do seu saldo disponível.
          </p>
        </div>

        <WithdrawStepper
          current={step}
          maxReachedIndex={maxReached}
          onSelect={kycApproved ? goTo : undefined}
        />

        {!kycApproved ? (
          <div className="rounded-md border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center">
            <ShieldAlertIcon className="mx-auto size-8 text-amber-500" />
            <p className="mt-3 text-sm font-medium">
              Saque bloqueado até a verificação
            </p>
            <p className="mt-1 text-xs text-muted-foreground text-pretty">
              Complete a verificação de identidade para liberar retiradas via PIX.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {step === "amount" ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/8 via-card/30 to-card/20 px-4 py-10 text-center shadow-[0_0_0_1px_var(--border)] sm:px-6 sm:py-12">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                  />
                  <p className="text-sm text-muted-foreground">
                    Quanto você quer retirar?
                  </p>

                  <div className="mt-5">
                    <WithdrawAmountInput
                      value={amountMask}
                      onChange={(next) => {
                        setAmountMask(next);
                        setError(null);
                      }}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Mínimo{" "}
                      <strong className="font-medium text-foreground">
                        {formatBRLFromCents(MIN_PAYOUT_CENTS)}
                      </strong>
                    </span>
                    <span aria-hidden className="hidden text-border sm:inline">
                      ·
                    </span>
                    <span>
                      Disponível{" "}
                      <strong className="font-medium text-foreground tabular-nums">
                        {formatBRLFromCents(balanceCents)}
                      </strong>
                    </span>
                  </div>

                  {balanceCents >= MIN_PAYOUT_CENTS ? (
                    <button
                      type="button"
                      onClick={setMaxAmount}
                      className="mt-3 text-xs font-medium text-primary hover:underline"
                    >
                      Usar saldo total
                    </button>
                  ) : null}
                </div>

                {error ? <FieldError>{error}</FieldError> : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={routes.dashboardWallet}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "justify-start",
                    )}
                  >
                    <ArrowLeftIcon className="size-4" />
                    Cancelar e voltar
                  </Link>
                  <Button
                    type="button"
                    onClick={advanceFromAmount}
                    disabled={balanceCents < MIN_PAYOUT_CENTS}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            ) : null}

            {step === "destination" ? (
              <div className="space-y-4">
                <div className="rounded-md border border-border/60 bg-card/30 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                      <KeyRoundIcon className="size-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Destino do saque</h3>
                      <p className="text-xs text-muted-foreground">
                        Transferência via PIX
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Informe a chave PIX que receberá{" "}
                    <strong className="text-foreground tabular-nums">
                      {formatBRLFromCents(amountCents)}
                    </strong>
                    .
                  </p>
                  <Field className="mt-4">
                    <FieldLabel htmlFor="payout-pix">Chave PIX</FieldLabel>
                    <Input
                      id="payout-pix"
                      value={pixKey}
                      onChange={(e) => {
                        setPixKey(e.target.value);
                        setError(null);
                      }}
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                      maxLength={140}
                      autoFocus
                    />
                    <FieldDescription>
                      A chave fica salva na sua conta para os próximos saques.
                    </FieldDescription>
                  </Field>
                </div>

                {error ? <FieldError>{error}</FieldError> : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => goTo("amount")}
                  >
                    <ArrowLeftIcon className="size-4" />
                    Voltar
                  </Button>
                  <Button type="button" onClick={advanceFromDestination}>
                    Continuar
                  </Button>
                </div>
              </div>
            ) : null}

            {step === "confirm" ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-border/60 bg-card/30">
                  <div className="border-b border-border/60 bg-primary/5 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                        <BanknoteIcon className="size-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Confirme a retirada</h3>
                        <p className="text-xs text-muted-foreground">
                          Revise antes de solicitar
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
                      {formatBRLFromCents(amountCents)}
                    </p>
                  </div>
                  <dl className="space-y-3 px-4 py-4 text-sm sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-muted-foreground">Chave PIX</dt>
                      <dd className="max-w-[70%] break-all text-right font-medium">
                        {pixKey.trim()}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <dt className="text-muted-foreground">Saldo após saque</dt>
                      <dd className="font-semibold tabular-nums">
                        {formatBRLFromCents(
                          Math.max(0, balanceCents - amountCents),
                        )}
                      </dd>
                    </div>
                  </dl>
                  <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground text-pretty sm:px-5">
                    O valor sai do saldo imediatamente e fica em análise para
                    pagamento via PIX.
                  </p>
                </div>

                {totpEnabled ? (
                  <Field>
                    <FieldLabel htmlFor="payout-totp">
                      Código 2FA <span className="text-primary">*</span>
                    </FieldLabel>
                    <Input
                      id="payout-totp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={totpCode}
                      onChange={(e) => {
                        setTotpCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                        setError(null);
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="font-mono tracking-widest"
                    />
                    <FieldDescription>
                      Confirme esta retirada com o aplicativo autenticador.
                    </FieldDescription>
                  </Field>
                ) : null}

                {error ? <FieldError>{error}</FieldError> : null}
                {success ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {success}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => goTo("destination")}
                    disabled={submitting}
                  >
                    <ArrowLeftIcon className="size-4" />
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void confirmPayout()}
                    disabled={submitting}
                  >
                    {submitting ? "Solicitando…" : "Confirmar retirada"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {success && step === "amount" ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {success}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            Histórico de retiradas
          </h2>
          <Link
            href={routes.dashboardWallet}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver extrato
          </Link>
        </div>

        {payouts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/70 bg-card/20 px-4 py-10 text-center">
            <BanknoteIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Nenhuma retirada ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Suas solicitações de saque aparecerão aqui.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
            {payouts.map((payout) => (
              <li
                key={payout.id}
                className="flex items-start justify-between gap-3 bg-card/30 px-3 py-3 sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {STATUS_LABEL[payout.status] ?? payout.status}
                  </p>
                  {payout.code ? (
                    <p className="mt-0.5 text-[11px] font-medium text-primary/80">
                      {payout.code}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground break-all">
                    {payout.pixKey}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateTimePt(payout.createdAt)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatBRLFromCents(payout.amountCents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
