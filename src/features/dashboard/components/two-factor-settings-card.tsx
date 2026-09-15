"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  CopyIcon,
  ShieldAlertIcon,
} from "lucide-react";

import {
  cancel2faSetup,
  disable2fa,
  enable2fa,
  fetch2faStatus,
  setup2fa,
  type TwoFactorSetup,
} from "@/features/auth/two-factor-api";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type Phase = "idle" | "setup" | "disable";

export function TwoFactorSettingsCard({
  enabled: enabledProp,
  onChanged,
}: {
  enabled?: boolean;
  onChanged?: () => Promise<void> | void;
}) {
  const [enabled, setEnabled] = useState(Boolean(enabledProp));
  const [phase, setPhase] = useState<Phase>("idle");
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    setEnabled(Boolean(enabledProp));
  }, [enabledProp]);

  useEffect(() => {
    if (enabledProp !== undefined) return;
    void fetch2faStatus()
      .then((s) => setEnabled(s.enabled))
      .catch(() => undefined);
  }, [enabledProp]);

  useEffect(() => {
    setCode(digits.join(""));
  }, [digits]);

  async function startSetup() {
    setConfirmOpen(false);
    setBusy(true);
    setError(null);
    try {
      const data = await setup2fa();
      setSetup(data);
      setPhase("setup");
      setDigits(["", "", "", "", "", ""]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível iniciar o 2FA.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await enable2fa(code);
      setEnabled(true);
      setPhase("idle");
      setSetup(null);
      await onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await disable2fa(code);
      setEnabled(false);
      setPhase("idle");
      setDigits(["", "", "", "", "", ""]);
      await onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSetup() {
    setBusy(true);
    try {
      await cancel2faSetup();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      setPhase("idle");
      setSetup(null);
      setError(null);
    }
  }

  return (
    <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">
          Verificação em duas etapas (2FA)
        </h2>
        <p className="text-xs text-muted-foreground">
          Recomendamos o Google Authenticator (ou app compatível) para proteger
          o login com um código temporário.
        </p>
      </div>

      {phase === "idle" ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            enabled
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-destructive/25 bg-destructive/5",
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            {enabled ? (
              <>
                <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">
                  2FA configurado
                </span>
              </>
            ) : (
              <>
                <ShieldAlertIcon className="size-4 text-destructive" />
                <span className="text-destructive">2FA não configurado</span>
              </>
            )}
          </div>
          {enabled ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPhase("disable");
                setDigits(["", "", "", "", "", ""]);
                setError(null);
              }}
            >
              Desativar
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
            >
              Ativar
            </Button>
          )}
        </div>
      ) : null}

      {phase === "setup" && setup ? (
        <div className="space-y-4">
          <ol className="space-y-4 text-sm">
            <li className="space-y-1">
              <p className="font-semibold">1. Instale o Google Authenticator</p>
              <p className="text-xs text-muted-foreground">
                Baixe o app para Android ou iOS (Authy e outros também funcionam).
              </p>
            </li>
            <li className="space-y-2">
              <p className="font-semibold">2. Escaneie o QR Code</p>
              <p className="text-xs text-muted-foreground">
                Use o app para escanear o código. Se preferir, copie a chave
                manualmente.
              </p>
              <div className="flex flex-col gap-4 rounded-md border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qrDataUrl}
                  alt="QR Code 2FA"
                  className="mx-auto size-44 rounded-md border border-border/60 bg-white p-2"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="break-all font-mono text-xs">{setup.secret}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      void navigator.clipboard.writeText(setup.secret);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    <CopyIcon className="size-3.5" />
                    {copied ? "Copiado" : "Copiar código"}
                  </Button>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Não compartilhe este código com ninguém.
                  </p>
                </div>
              </div>
            </li>
            <li className="space-y-2">
              <p className="font-semibold">3. Digite o código de 6 dígitos</p>
              <p className="text-xs text-muted-foreground">
                O app exibe um código temporário com o título Elloot.
              </p>
              <OtpInputs digits={digits} setDigits={setDigits} refs={codeRefs} />
            </li>
          </ol>
          {error ? <FieldError>{error}</FieldError> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void cancelSetup()}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void confirmEnable()}
            >
              {busy ? "Ativando…" : "Continuar"}
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "disable" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Digite o código atual do Authenticator para desativar o 2FA.
          </p>
          <Field>
            <FieldLabel>Código</FieldLabel>
            <OtpInputs digits={digits} setDigits={setDigits} refs={codeRefs} />
          </Field>
          {error ? <FieldError>{error}</FieldError> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPhase("idle");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDisable()}
            >
              {busy ? "Desativando…" : "Desativar 2FA"}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Atenção!"
        description="Você vai configurar o Google Authenticator. Guarde a chave secreta em local seguro — ela é necessária se trocar de celular."
        confirmLabel="Ok, ciente"
        onConfirm={() => void startSetup()}
      />
    </section>
  );
}

function OtpInputs({
  digits,
  setDigits,
  refs,
}: {
  digits: string[];
  setDigits: (next: string[]) => void;
  refs: React.MutableRefObject<Array<HTMLInputElement | null>>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {digits.map((digit, index) => (
        <span key={index} className="contents">
          {index === 3 ? (
            <span className="px-0.5 text-muted-foreground">–</span>
          ) : null}
          <Input
            ref={(el) => {
              refs.current[index] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(-1);
              const next = [...digits];
              next[index] = v;
              setDigits(next);
              if (v && index < 5) refs.current[index + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[index] && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            className="size-10 rounded-md text-center text-base font-semibold"
            aria-label={`Dígito ${index + 1}`}
          />
        </span>
      ))}
    </div>
  );
}
