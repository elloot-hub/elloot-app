"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  FileImageIcon,
  IdCardIcon,
  InfoIcon,
  MailIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react";

import { useAuth } from "@/features/auth/context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VerificationSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import {
  fetchMyKyc,
  submitKyc,
  type KycMineResponse,
} from "@/features/dashboard/kyc-api";
import { uploadMedia } from "@/features/media/api";
import { ApiError } from "@/lib/api/errors";
import { formatDateTimePt } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type DocKey = "front" | "back" | "selfie";
type DocType = "RG" | "CNH";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5_242_880;

function maskCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function VerificationClient() {
  const { user, loading, refreshUser } = useAuth();
  const [kyc, setKyc] = useState<KycMineResponse | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setKycLoading(true);
      try {
        const data = await fetchMyKyc();
        if (!cancelled) setKyc(data);
      } catch {
        if (!cancelled) setKyc(null);
      } finally {
        if (!cancelled) setKycLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.kycStatus]);

  if (loading || !user || kycLoading) {
    return <VerificationSkeleton />;
  }

  const status = kyc?.kycStatus ?? user.kycStatus ?? "NONE";
  const approved = status === "APPROVED";
  const pending = status === "PENDING";
  const rejected = status === "REJECTED";
  const emailOk = Boolean(user.emailVerifiedAt);
  const totpOk = Boolean(user.totpEnabled);

  async function reload() {
    const data = await fetchMyKyc();
    setKyc(data);
    await refreshUser();
  }

  const progressDone =
    Number(emailOk) + Number(approved) + Number(totpOk);
  const progressPercent = Math.round((progressDone / 3) * 100);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusCard
          title="E-mail"
          ok={emailOk}
          detail={
            emailOk
              ? user.email
              : "Pendente — login Google/Discord confirma automaticamente."
          }
          icon={<MailIcon className="size-4 text-primary" />}
        />
        <StatusCard
          title="2FA (Authenticator)"
          ok={totpOk}
          detail={
            totpOk
              ? "Proteção ativa no login"
              : "Opcional — protege o login com código do app"
          }
          icon={<ShieldCheckIcon className="size-4 text-primary" />}
          action={
            <Link
              href={routes.dashboardSettings}
              className={cn(
                buttonVariants({
                  size: "sm",
                  variant: totpOk ? "outline" : "default",
                }),
                "mt-2",
              )}
            >
              {totpOk ? "Gerenciar em Configurações" : "Ativar 2FA"}
            </Link>
          }
        />
      </div>

      {!wizardOpen ? (
        <section className="flex flex-col gap-4 rounded-md border border-border/60 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold tracking-tight">
              {approved
                ? "Identidade verificada"
                : pending
                  ? "Verificação em análise"
                  : rejected
                    ? "Verificação recusada"
                    : "Verifique sua identidade"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {approved
                ? "Documentos aprovados. Saques via PIX estão liberados."
                : pending
                  ? "Seus documentos estão sendo analisados. Você será avisado quando terminar."
                  : "Envie nome completo, CPF, foto do documento (RG ou CNH) e uma selfie segurando o mesmo documento."}
            </p>
            {rejected && kyc?.submission?.reviewNote ? (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                {kyc.submission.reviewNote}
              </p>
            ) : null}
          </div>
          {!approved && !pending ? (
            <Button
              type="button"
              className="shrink-0"
              onClick={() => setWizardOpen(true)}
            >
              {rejected ? "Reenviar documentos" : "Solicitar verificação"}
            </Button>
          ) : null}
          {approved ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <BadgeCheckIcon className="size-3.5" />
              Aprovado
            </span>
          ) : null}
        </section>
      ) : (
        <KycWizard
          defaultName={user.name ?? kyc?.submission?.fullName ?? ""}
          onCancel={() => setWizardOpen(false)}
          onDone={async () => {
            setWizardOpen(false);
            await reload();
          }}
        />
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight">
          Histórico de solicitações
        </h3>
        {kyc?.submission ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-4 py-3">
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">
                {kyc.submission.fullName} · {kyc.submission.documentMasked}
              </p>
              <p className="text-xs text-muted-foreground">
                Enviado {formatDateTimePt(kyc.submission.createdAt)}
              </p>
            </div>
            <StatusPill
              ok={approved}
              pending={pending}
              rejected={rejected}
            />
          </div>
        ) : (
          <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Você ainda não enviou nenhuma solicitação de verificação.
          </div>
        )}
      </section>
    </div>
  );
}

function StatusCard({
  title,
  ok,
  detail,
  icon,
  action,
}: {
  title: string;
  ok: boolean;
  detail: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <StatusPill ok={ok} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground break-all">{detail}</p>
      {action}
    </div>
  );
}

function StatusPill({
  ok,
  pending,
  rejected,
}: {
  ok: boolean;
  pending?: boolean;
  rejected?: boolean;
}) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
        Verificado
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
        Em análise
      </span>
    );
  }
  if (rejected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
        Recusado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      Pendente
    </span>
  );
}

function KycWizard({
  defaultName,
  onCancel,
  onDone,
}: {
  defaultName: string;
  onCancel: () => void;
  onDone: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(defaultName);
  const [cpf, setCpf] = useState("");
  const [docType, setDocType] = useState<DocType>("RG");
  const [assets, setAssets] = useState<
    Partial<Record<DocKey, { id: string; preview: string }>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function send() {
    if (fullName.trim().length < 3) {
      setError("Informe o nome completo.");
      return;
    }
    if (cpf.replace(/\D/g, "").length !== 11) {
      setError("Informe um CPF válido.");
      return;
    }
    if (!assets.front || !assets.back || !assets.selfie) {
      setError("Envie frente, verso e selfie com o documento.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitKyc({
        fullName: fullName.trim(),
        documentNumber: cpf.replace(/\D/g, ""),
        frontAssetId: assets.front.id,
        backAssetId: assets.back.id,
        selfieAssetId: assets.selfie.id,
      });
      await onDone();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar a verificação.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            Verifique sua identidade
          </h3>
          <p className="text-sm text-muted-foreground">
            Envie seu nome completo, CPF, fotos do {docType} e uma selfie
            segurando o documento.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Cancelar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="kyc-name">Nome completo</FieldLabel>
          <Input
            id="kyc-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 rounded-sm"
            placeholder="Como está no documento"
            maxLength={80}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="kyc-cpf">CPF</FieldLabel>
          <Input
            id="kyc-cpf"
            value={cpf}
            onChange={(e) => setCpf(maskCpfInput(e.target.value))}
            className="h-10 rounded-sm"
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
        </Field>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
        Saques só podem ir para conta bancária no mesmo CPF.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["RG", "CNH"] as DocType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setDocType(type)}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors",
              docType === type
                ? "border-primary bg-primary/10"
                : "border-border/60 bg-background/40 hover:bg-muted/30",
            )}
          >
            <IdCardIcon className="size-5 text-primary" />
            <span>
              <span className="block text-sm font-semibold">{type}</span>
              <span className="text-xs text-muted-foreground">
                {type === "RG"
                  ? "Carteira de identidade"
                  : "Carteira de motorista"}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DocUpload
          title={`Frente do ${docType}`}
          hint="JPG ou PNG, até 5 MB"
          preview={assets.front?.preview}
          onPicked={(asset) =>
            setAssets((prev) => ({ ...prev, front: asset }))
          }
        />
        <DocUpload
          title={`Verso do ${docType}`}
          hint="Lado com CPF / dados"
          preview={assets.back?.preview}
          onPicked={(asset) =>
            setAssets((prev) => ({ ...prev, back: asset }))
          }
        />
        <DocUpload
          title="Selfie com o documento"
          hint="Rosto e documento visíveis"
          preview={assets.selfie?.preview}
          onPicked={(asset) =>
            setAssets((prev) => ({ ...prev, selfie: asset }))
          }
        />
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-3.5 text-primary" />
        Seus arquivos são privados e usados só para conferir a identidade.
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={() => void send()}
        >
          {submitting ? "Enviando…" : "Enviar solicitação"}
        </Button>
      </div>
    </section>
  );
}

function DocUpload({
  title,
  hint,
  preview,
  onPicked,
}: {
  title: string;
  hint: string;
  preview?: string;
  onPicked: (asset: { id: string; preview: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Máximo 5 MB.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { asset } = await uploadMedia({
        file,
        purpose: "GENERAL",
        visibility: "PRIVATE",
      });
      onPicked({ id: asset.id, preview: asset.url });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">{title}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-dashed border-border/70 bg-muted/20 px-2 text-center"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <>
            <UploadIcon className="size-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {busy ? "Enviando…" : "Clique para enviar"}
            </span>
            <span className="text-[10px] text-muted-foreground/80">{hint}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void onFile(file);
        }}
      />
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      {preview ? (
        <p className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
          <FileImageIcon className="size-3" />
          Foto anexada
        </p>
      ) : null}
    </div>
  );
}
